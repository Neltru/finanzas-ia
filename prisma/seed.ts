import { PrismaClient, type Category } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { addMonths, addDays, startOfMonth } from "date-fns";

const prisma = new PrismaClient();

const MONTHS_OF_HISTORY = 8;

const SYSTEM_CATEGORIES = [
  { name: "Alimentos y supermercado", icon: "shopping-cart", color: "emerald" },
  { name: "Restaurantes y café", icon: "utensils", color: "orange" },
  { name: "Transporte", icon: "car", color: "blue" },
  { name: "Vivienda", icon: "home", color: "violet" },
  { name: "Servicios", icon: "plug", color: "cyan" },
  { name: "Suscripciones", icon: "repeat", color: "pink" },
  { name: "Salud", icon: "heart-pulse", color: "red" },
  { name: "Entretenimiento", icon: "film", color: "yellow" },
  { name: "Compras", icon: "shopping-bag", color: "indigo" },
  { name: "Ingreso / Nómina", icon: "banknote", color: "green" },
  { name: "Sin clasificar", icon: "help-circle", color: "gray" },
];

// Suscripciones: mismo monto, mismo día del mes → el detector las agrupa
const RECURRING = [
  { merchant: "NETFLIX", category: "Suscripciones", amount: 219, day: 3 },
  { merchant: "SPOTIFY", category: "Suscripciones", amount: 115, day: 7 },
  { merchant: "OPENAI CHATGPT", category: "Suscripciones", amount: 350, day: 12 },
  { merchant: "GYM FITNESS CLUB", category: "Salud", amount: 599, day: 1 },
  { merchant: "CFE SUMINISTRADOR", category: "Servicios", amount: 480, day: 18, variance: 150 },
  { merchant: "TOTALPLAY INTERNET", category: "Servicios", amount: 599, day: 5 },
  { merchant: "RENTA DEPARTAMENTO", category: "Vivienda", amount: 8500, day: 1 },
];

// Gasto variable: monto aleatorio dentro de un rango
const VARIABLE = [
  { merchant: "WALMART", category: "Alimentos y supermercado", min: 250, max: 1400 },
  { merchant: "OXXO", category: "Alimentos y supermercado", min: 30, max: 180 },
  { merchant: "UBER EATS", category: "Restaurantes y café", min: 120, max: 450 },
  { merchant: "STARBUCKS", category: "Restaurantes y café", min: 65, max: 140 },
  { merchant: "UBER TRIP", category: "Transporte", min: 60, max: 250 },
  { merchant: "GASOLINERA PEMEX", category: "Transporte", min: 400, max: 900 },
  { merchant: "AMAZON MX", category: "Compras", min: 150, max: 2200 },
  { merchant: "CINEPOLIS", category: "Entretenimiento", min: 90, max: 320 },
  { merchant: "FARMACIA GUADALAJARA", category: "Salud", min: 80, max: 600 },
];

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function main() {
  console.log(" Seeding...");

  // Se corre también contra producción para crear el demo, así que solo toca
  // datos del usuario demo. (Antes borraba las tablas completas, y con
  // SEED_EMAIL dejó los datos demo a nombre de una cuenta real.)
  const user = await prisma.user.upsert({
    where: { email: "demo@finanzas.app" },
    create: { email: "demo@finanzas.app", name: "Usuario Demo" },
    update: {},
  });

  // Borrar las conexiones del demo arrastra cuentas y transacciones (cascade)
  await prisma.bankConnection.deleteMany({ where: { userId: user.id } });

  // Categorías globales: crear solo las que falten. No se borran porque las
  // transacciones de usuarios reales apuntan a ellas.
  const categories: Category[] = [];
  for (const c of SYSTEM_CATEGORIES) {
    const existente = await prisma.category.findFirst({
      where: { name: c.name, isSystem: true },
    });
    categories.push(
      existente ??
        (await prisma.category.create({
          data: { name: c.name, icon: c.icon, color: c.color, isSystem: true },
        }))
    );
  }
  const catByName = new Map(categories.map((c) => [c.name, c]));

  const connection = await prisma.bankConnection.create({
    data: {
      userId: user.id,
      plaidItemId: `demo-item-${faker.string.alphanumeric(12)}`,
      plaidAccessToken: "demo-token-no-real",
      institutionName: "Banco Demo",
      lastSyncedAt: new Date(),
    },
  });

  const checking = await prisma.account.create({
    data: {
      bankConnectionId: connection.id,
      plaidAccountId: `demo-checking-${faker.string.alphanumeric(8)}`,
      name: "Cuenta de débito",
      mask: "4821",
      type: "checking",
      currentBalance: 0,
    },
  });

  const credit = await prisma.account.create({
    data: {
      bankConnectionId: connection.id,
      plaidAccountId: `demo-credit-${faker.string.alphanumeric(8)}`,
      name: "Tarjeta de crédito",
      mask: "9903",
      type: "credit_card",
      currentBalance: 0,
    },
  });

  const start = startOfMonth(addMonths(new Date(), -(MONTHS_OF_HISTORY - 1)));
  const generadas: any[] = [];

  for (let m = 0; m < MONTHS_OF_HISTORY; m++) {
    const monthStart = addMonths(start, m);

    // Nómina quincenal (negativo = ingreso, convención Plaid)
    for (const payday of [1, 15]) {
      const amount = -randomAmount(11000, 12500);
      generadas.push({
        accountId: checking.id,
        plaidTransactionId: `demo-${faker.string.uuid()}`,
        amount,
        date: addDays(monthStart, payday - 1),
        merchantName: "NOMINA EMPRESA SA DE CV",
        rawDescription: "DEP NOMINA EMPRESA SA DE CV",
        normalizedDescription: "NOMINA EMPRESA",
        categoryId: catByName.get("Ingreso / Nómina")!.id,
        categorizationSource: "CACHE",
      });
    }

    // Suscripciones y gastos fijos
    for (const r of RECURRING) {
      const jitter = r.variance ? randomAmount(-r.variance, r.variance) : randomAmount(-2, 2);
      const amount = Math.round((r.amount + jitter) * 100) / 100;
      generadas.push({
        accountId: checking.id,
        plaidTransactionId: `demo-${faker.string.uuid()}`,
        amount,
        date: addDays(monthStart, Math.min(r.day - 1, 27)),
        merchantName: r.merchant,
        rawDescription: `${r.merchant} ${faker.string.numeric(6)}`,
        normalizedDescription: r.merchant,
        categoryId: catByName.get(r.category)!.id,
        categorizationSource: "CACHE",
        isRecurring: true,
        recurringGroupId: `recurring-${r.merchant.replace(/\s+/g, "-").toLowerCase()}`,
      });
    }

    // Gasto variable en tarjeta: 15-24 transacciones al mes. Con 25-40 el
    // gasto promedio era el 107% del ingreso y el demo se veía en números
    // rojos; así queda en ~83% (simulado: solo ~5% de los meses en rojo).
    const n = Math.floor(randomAmount(15, 24));
    for (let i = 0; i < n; i++) {
      const v = VARIABLE[Math.floor(Math.random() * VARIABLE.length)];
      const amount = randomAmount(v.min, v.max);
      generadas.push({
        accountId: credit.id,
        plaidTransactionId: `demo-${faker.string.uuid()}`,
        amount,
        date: addDays(monthStart, Math.floor(Math.random() * 27)),
        merchantName: v.merchant,
        rawDescription: `${v.merchant} ${faker.string.numeric(4)}`,
        normalizedDescription: v.merchant,
        categoryId: catByName.get(v.category)!.id,
        categorizationSource: "CACHE",
      });
    }

    // ~3 sin clasificar al mes, simulando fallos reales de la IA
    for (let i = 0; i < 3; i++) {
      const amount = randomAmount(20, 300);
      const ref = faker.string.alphanumeric(10).toUpperCase();
      generadas.push({
        accountId: credit.id,
        plaidTransactionId: `demo-${faker.string.uuid()}`,
        amount,
        date: addDays(monthStart, Math.floor(Math.random() * 27)),
        merchantName: null,
        rawDescription: `POS COMPRA ${ref}`,
        normalizedDescription: "POS COMPRA",
        categoryId: catByName.get("Sin clasificar")!.id,
        categorizationSource: "UNCLASSIFIED",
      });
    }
  }

  // El mes en curso se llena con días al azar (1-28): sin este filtro quedaban
  // cargos con fecha futura, y los insights calculaban mal el próximo cobro.
  const hoy = new Date();
  const txs = generadas.filter((t) => t.date <= hoy);

  // Saldos a partir de lo que sí se insertó (convención Plaid: monto > 0 = gasto).
  // La tarjeta se liquida completa cada mes desde débito, así que su saldo es
  // solo lo gastado este mes; antes nunca se pagaba y acumulaba ~$100k de deuda.
  // El patrimonio (débito - tarjeta) queda igual: 15000 + ingresos - gastos.
  const inicioMes = startOfMonth(hoy);
  const sumar = (accountId: string, desde?: Date) =>
    txs
      .filter((t) => t.accountId === accountId && (!desde || t.date >= desde))
      .reduce((s, t) => s + t.amount, 0);
  const creditBalance = sumar(credit.id, inicioMes);
  const tarjetaYaPagada = sumar(credit.id) - creditBalance;
  const checkingBalance = 15000 - sumar(checking.id) - tarjetaYaPagada;

  console.log(`Insertando ${txs.length} transacciones...`);
  await prisma.transaction.createMany({ data: txs });

  await prisma.account.update({
    where: { id: checking.id },
    data: { currentBalance: Math.max(checkingBalance, 500) },
  });
  await prisma.account.update({
    where: { id: credit.id },
    data: { currentBalance: -creditBalance },
  });

  // Precargar el cache de categorización, como si la IA ya hubiera visto estos merchants
  const seen = new Map<string, string>();
  for (const r of RECURRING) seen.set(r.merchant, r.category);
  for (const v of VARIABLE) seen.set(v.merchant, v.category);

  for (const [desc, catName] of seen) {
    // upsert: el cache es global y puede tener ya entradas de usuarios reales
    await prisma.categorizationCache.upsert({
      where: { normalizedDescription: desc },
      create: {
        normalizedDescription: desc,
        categoryId: catByName.get(catName)!.id,
        confidence: 0.93,
        hitCount: Math.floor(randomAmount(5, 60)),
      },
      update: {},
    });
  }
  

  console.log(` Listo: ${txs.length} transacciones, ${categories.length} categorías`);
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());