import { db } from './db.js';

export async function seed() {
  try {
    const mainCategoriesCount = await db.categories
      .where('bookId')
      .equals('main')
      .count();

    if (mainCategoriesCount === 0) {
      console.log('Seeding default categories for "main" book...');
      const defaultCategories = [
        { bookId: 'main', name: 'Sales', type: 'income', color: '#27AE60', isDefault: true, note: 'Default income category' },
        { bookId: 'main', name: 'Service Income', type: 'income', color: '#1A9F7E', isDefault: true, note: '' },
        { bookId: 'main', name: 'Other Income', type: 'income', color: '#2980B9', isDefault: true, note: '' },
        { bookId: 'main', name: 'Purchases', type: 'expense', color: '#E74C3C', isDefault: true, note: 'Default purchase category' },
        { bookId: 'main', name: 'Fuel', type: 'expense', color: '#E67E22', isDefault: true, note: '' },
        { bookId: 'main', name: 'Office Rent', type: 'expense', color: '#8E44AD', isDefault: true, note: '' },
        { bookId: 'main', name: 'Salaries', type: 'expense', color: '#C0392B', isDefault: true, note: '' },
        { bookId: 'main', name: 'Utilities', type: 'expense', color: '#2C3E50', isDefault: true, note: 'Electricity, water, internet' },
        { bookId: 'main', name: 'Travel', type: 'expense', color: '#16A085', isDefault: true, note: '' },
        { bookId: 'main', name: 'Miscellaneous', type: 'expense', color: '#7F8C8D', isDefault: true, note: 'Catch-all' },
      ];

      await db.categories.bulkAdd(defaultCategories);
      console.log('Seeding complete.');
    }
  } catch (err) {
    console.error('Failed to seed database:', err);
  }
}
