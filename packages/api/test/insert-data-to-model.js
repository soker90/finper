"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertStock = exports.insertSupplyReading = exports.insertSupply = exports.insertProperty = exports.insertSubscriptionCandidate = exports.insertSubscription = exports.insertLoanPayment = exports.insertLoan = exports.insertPension = exports.insertBudget = exports.insertTransaction = exports.insertStore = exports.insertCategory = exports.insertAccount = void 0;
exports.insertCredentials = insertCredentials;
const faker_1 = require("@faker-js/faker");
const finper_models_1 = require("@soker90/finper-models");
const inputs_1 = require("../src/config/inputs");
const generate_values_1 = require("./generate-values");
const calcLoanProjection_1 = require("../src/services/utils/calcLoanProjection");
const roundNumber_1 = require("../src/utils/roundNumber");
async function insertCredentials(params = {}) {
    const parsedParams = {};
    if (params.password) {
        parsedParams.password = params.password;
    }
    if (params.username) {
        parsedParams.username = params.username.slice(0, inputs_1.MAX_USERNAME_LENGTH).toLowerCase();
    }
    return await finper_models_1.UserModel.create({
        password: faker_1.faker.internet.password({ length: inputs_1.MIN_PASSWORD_LENGTH }),
        username: faker_1.faker.internet.username().slice(0, inputs_1.MAX_USERNAME_LENGTH).toLowerCase(),
        ...parsedParams
    });
}
const insertAccount = async (params = {}) => {
    return finper_models_1.AccountModel.create({
        name: params.name ?? faker_1.faker.finance.accountName(),
        bank: params.bank ?? faker_1.faker.lorem.word(),
        balance: params.balance ?? faker_1.faker.number.int(),
        isActive: params.isActive ?? faker_1.faker.datatype.boolean(),
        user: params.user ?? faker_1.faker.internet.username().slice(inputs_1.MIN_LENGTH_USERNAME, inputs_1.MAX_USERNAME_LENGTH).toLowerCase()
    });
};
exports.insertAccount = insertAccount;
const insertCategory = async (params = {}) => {
    const user = params.user ?? (0, generate_values_1.generateUsername)();
    const parent = params.parent ?? params.root
        ? false
        : (await (0, exports.insertCategory)({
            user,
            root: true,
            type: params.type
        }))._id;
    const category = await finper_models_1.CategoryModel.create({
        name: params.name ?? faker_1.faker.commerce.department(),
        type: params.type ?? (Math.random() > 0.5 ? finper_models_1.TRANSACTION.Expense : finper_models_1.TRANSACTION.Income),
        ...(parent && { parent }),
        user,
        ...(params.budgetRuleClass && { budgetRuleClass: params.budgetRuleClass })
    });
    return category.populate('parent');
};
exports.insertCategory = insertCategory;
const insertStore = async (params = {}) => {
    return finper_models_1.StoreModel.create({
        name: params.name ?? faker_1.faker.company.name(),
        user: params.user ?? faker_1.faker.internet.username().slice(inputs_1.MIN_LENGTH_USERNAME, inputs_1.MAX_USERNAME_LENGTH).toLowerCase()
    });
};
exports.insertStore = insertStore;
const insertTransaction = async (params = {}) => {
    const user = (params.user ?? faker_1.faker.internet.username().slice(inputs_1.MIN_LENGTH_USERNAME, inputs_1.MAX_USERNAME_LENGTH).toLowerCase());
    return finper_models_1.TransactionModel.create({
        date: params.date ?? faker_1.faker.date.past().getTime(),
        category: params.category ?? (await (0, exports.insertCategory)({ user })),
        amount: params.amount ?? faker_1.faker.number.int(),
        type: params.type ?? (Math.random() > 0.5 ? finper_models_1.TRANSACTION.Expense : finper_models_1.TRANSACTION.Income),
        account: params.account ?? (await (0, exports.insertAccount)({ user })),
        note: params.note ?? faker_1.faker.lorem.sentence(),
        store: params.store ?? (await (0, exports.insertStore)({ user })),
        tags: params.tags ?? [],
        user
    });
};
exports.insertTransaction = insertTransaction;
const insertBudget = async (params = {}) => {
    const user = (params.user ?? (0, generate_values_1.generateUsername)());
    const budget = await finper_models_1.BudgetModel.create({
        year: params.year ?? faker_1.faker.date.past().getFullYear(),
        month: params.month ?? faker_1.faker.date.past().getMonth(),
        category: params.category ?? (await (0, exports.insertCategory)({ user, ...(params.type && { type: params.type }) }))._id,
        amount: faker_1.faker.number.int(),
        user
    });
    return params.category ? budget.populate('category') : budget;
};
exports.insertBudget = insertBudget;
const insertPension = async (params = {}) => {
    return finper_models_1.PensionModel.create({
        date: params.date ?? faker_1.faker.number.int(),
        value: params.value ?? faker_1.faker.number.int(),
        companyAmount: params.companyAmount ?? faker_1.faker.number.int(),
        companyUnits: params.companyUnits ?? faker_1.faker.number.int(),
        employeeUnits: params.employeeUnits ?? faker_1.faker.number.int(),
        employeeAmount: params.employeeAmount ?? faker_1.faker.number.int(),
        user: params.user ?? faker_1.faker.internet.username().slice(inputs_1.MIN_LENGTH_USERNAME, inputs_1.MAX_USERNAME_LENGTH).toLowerCase()
    });
};
exports.insertPension = insertPension;
const insertLoan = async (params = {}) => {
    const user = (params.user ?? (0, generate_values_1.generateUsername)());
    const account = params.account ?? (await (0, exports.insertAccount)({ user }))._id;
    const category = params.category ?? (await (0, exports.insertCategory)({ user, type: finper_models_1.TRANSACTION.Expense }))._id;
    const initialAmount = params.initialAmount ?? 10000;
    const interestRate = params.interestRate ?? 3;
    const monthlyPayment = params.monthlyPayment ?? 200;
    const startDate = params.startDate ?? Date.now();
    // Calculate initialEstimatedCost dynamically from the amortization table
    const initialProjection = (0, calcLoanProjection_1.buildAmortizationTable)([], initialAmount, interestRate, monthlyPayment, [], startDate);
    const calculatedEstimatedCost = (0, roundNumber_1.roundNumber)(initialProjection.reduce((s, r) => s + r.amount, 0));
    return finper_models_1.LoanModel.create({
        name: params.name ?? faker_1.faker.lorem.words(2),
        initialAmount,
        pendingAmount: params.pendingAmount ?? initialAmount,
        interestRate,
        startDate,
        monthlyPayment,
        initialEstimatedCost: params.initialEstimatedCost ?? calculatedEstimatedCost,
        account,
        category,
        user
    });
};
exports.insertLoan = insertLoan;
const insertLoanPayment = async (params = {}) => {
    const user = (params.user ?? (0, generate_values_1.generateUsername)());
    const loan = params.loan ?? (await (0, exports.insertLoan)({ user }))._id;
    const principal = params.principal ?? 175;
    const accumulatedPrincipal = params.accumulatedPrincipal ?? principal;
    // pendingCapital = initialAmount(10000) - accumulatedPrincipal, consistent with the defaults
    const pendingCapital = params.pendingCapital ?? (0, roundNumber_1.roundNumber)(10000 - accumulatedPrincipal);
    return finper_models_1.LoanPaymentModel.create({
        loan,
        date: params.date ?? Date.now(),
        amount: params.amount ?? 200,
        interest: params.interest ?? 25,
        principal,
        accumulatedPrincipal,
        pendingCapital,
        type: params.type ?? finper_models_1.LOAN_PAYMENT.ORDINARY,
        user
    });
};
exports.insertLoanPayment = insertLoanPayment;
const insertSubscription = async (params = {}) => {
    const user = (params.user ?? (0, generate_values_1.generateUsername)());
    const account = params.accountId ? { _id: params.accountId } : await (0, exports.insertAccount)({ user });
    const category = params.categoryId ? { _id: params.categoryId } : await (0, exports.insertCategory)({ user });
    return finper_models_1.SubscriptionModel.create({
        name: params.name ?? faker_1.faker.company.name(),
        amount: params.amount ?? faker_1.faker.number.float({ min: 1, max: 50, multipleOf: 0.01 }),
        cycle: params.cycle ?? 1,
        categoryId: category._id,
        accountId: account._id,
        nextPaymentDate: params.nextPaymentDate ?? null,
        user
    });
};
exports.insertSubscription = insertSubscription;
const insertSubscriptionCandidate = async (params = {}) => {
    const user = (params.user ?? (0, generate_values_1.generateUsername)());
    const transaction = params.transactionId
        ? { _id: params.transactionId }
        : await (0, exports.insertTransaction)({ user });
    const subscription = params.subscriptionId
        ? { _id: params.subscriptionId }
        : await (0, exports.insertSubscription)({ user });
    return finper_models_1.SubscriptionCandidateModel.create({
        transactionId: transaction._id,
        subscriptionIds: [subscription._id],
        user
    });
};
exports.insertSubscriptionCandidate = insertSubscriptionCandidate;
const insertProperty = async (params = {}) => {
    const user = (params.user ?? (0, generate_values_1.generateUsername)());
    return finper_models_1.PropertyModel.create({
        name: params.name ?? faker_1.faker.location.streetAddress(),
        user
    });
};
exports.insertProperty = insertProperty;
const insertSupply = async (params = {}) => {
    const user = (params.user ?? (0, generate_values_1.generateUsername)());
    const propertyId = params.propertyId ?? (await (0, exports.insertProperty)({ user }))._id;
    return finper_models_1.SupplyModel.create({
        // defaults sobreescribibles por cualquier campo de params
        name: faker_1.faker.company.name(),
        type: finper_models_1.SUPPLY_TYPE.ELECTRICITY,
        ...params,
        // campos que siempre se resuelven arriba y no pueden sobreescribirse
        propertyId,
        user
    });
};
exports.insertSupply = insertSupply;
const insertSupplyReading = async (params = {}) => {
    const user = (params.user ?? (0, generate_values_1.generateUsername)());
    const supplyId = params.supplyId ?? (await (0, exports.insertSupply)({ user }))._id;
    const startDate = params.startDate ?? faker_1.faker.date.past({ years: 1 }).getTime();
    const endDate = params.endDate ?? faker_1.faker.date.between({ from: startDate, to: Date.now() }).getTime();
    return finper_models_1.SupplyReadingModel.create({
        supplyId,
        startDate,
        endDate,
        amount: params.amount ?? faker_1.faker.number.float({ min: -50, max: 250, multipleOf: 0.01 }),
        consumptionPeak: params.consumptionPeak ?? faker_1.faker.number.int({ min: 10, max: 100 }),
        consumptionFlat: params.consumptionFlat ?? faker_1.faker.number.int({ min: 10, max: 100 }),
        consumptionOffPeak: params.consumptionOffPeak ?? faker_1.faker.number.int({ min: 10, max: 100 }),
        consumption: params.consumption ?? faker_1.faker.number.int({ min: 10, max: 100 }),
        user
    });
};
exports.insertSupplyReading = insertSupplyReading;
const insertStock = async (params = {}) => {
    const user = (params.user ?? (0, generate_values_1.generateUsername)());
    return finper_models_1.StockModel.create({
        ticker: params.ticker ?? faker_1.faker.string.alpha({ length: 4, casing: 'upper' }),
        name: params.name ?? faker_1.faker.company.name(),
        shares: params.shares ?? faker_1.faker.number.float({ min: 1, max: 100, multipleOf: 0.01 }),
        price: params.price ?? faker_1.faker.number.float({ min: 1, max: 500, multipleOf: 0.01 }),
        type: params.type ?? finper_models_1.STOCK_TYPE.Buy,
        date: params.date ?? faker_1.faker.date.past().getTime(),
        platform: params.platform ?? 'DEGIRO',
        user
    });
};
exports.insertStock = insertStock;
