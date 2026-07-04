const cron = require('node-cron');
const { Op } = require('sequelize');
const { RecurringExpense, Expense } = require('../models');

const calculateNextDueDate = (currentDate, frequency) => {
  const date = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.toISOString().split('T')[0];
};

const processRecurringExpenses = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find all active recurring expenses where nextDueDate <= today
    const dueExpenses = await RecurringExpense.findAll({
      where: {
        isActive: true,
        nextDueDate: { [Op.lte]: today },
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: today } },
        ],
      },
    });

    console.log(`📋 Processing ${dueExpenses.length} recurring expense(s)...`);

    for (const recurring of dueExpenses) {
      try {
        // Create the actual expense
        await Expense.create({
          userId: recurring.userId,
          amount: recurring.amount,
          description: recurring.description,
          category: recurring.category,
          date: recurring.nextDueDate,
          paymentMethod: recurring.paymentMethod,
          currency: recurring.currency,
          notes: `Auto-generated from recurring expense: ${recurring.description}`,
          isRecurring: true,
          recurringId: recurring.id,
        });

        // Update next due date
        const nextDate = calculateNextDueDate(recurring.nextDueDate, recurring.frequency);

        // Check if the recurring expense has ended
        if (recurring.endDate && nextDate > recurring.endDate) {
          recurring.isActive = false;
        }

        recurring.nextDueDate = nextDate;
        recurring.lastProcessedAt = new Date();
        await recurring.save();

        console.log(`  ✅ Processed: ${recurring.description} (${recurring.amount})`);
      } catch (err) {
        console.error(`  ❌ Error processing recurring #${recurring.id}:`, err.message);
      }
    }

    if (dueExpenses.length > 0) {
      console.log(`✅ Finished processing recurring expenses.`);
    }
  } catch (error) {
    console.error('❌ Error in recurring expense cron job:', error.message);
  }
};

// Schedule cron to run every day at midnight
const startRecurringJob = () => {
  cron.schedule('0 0 * * *', () => {
    console.log('⏰ Running recurring expense processor...');
    processRecurringExpenses();
  });

  console.log('🔄 Recurring expense cron job scheduled (daily at midnight)');

  // Also run once on startup to catch any missed entries
  processRecurringExpenses();
};

module.exports = { startRecurringJob, processRecurringExpenses };
