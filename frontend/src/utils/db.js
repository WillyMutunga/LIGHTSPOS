import Dexie from 'dexie';

export const db = new Dexie('POSOfflineDB');

db.version(1).stores({
  pendingSales: '++id, timestamp',
  products: 'id, barcode',
  customers: 'id'
});
