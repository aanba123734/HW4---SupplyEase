const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const app = express();
const port = 3000;

// 資料庫連線設定 (對應 docker-compose.yml)
const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'SupplyEaseDB',
  password: 'SupplyEase',
  port: 5432,
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// --- 自動初始化資料表 (Auto Init Tables) ---
const initDB = async () => {
    try {
        // 建立 Suppliers 表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id SERIAL PRIMARY KEY,
                company_name VARCHAR(100) NOT NULL,
                contact_person VARCHAR(100),
                email VARCHAR(100),
                phone VARCHAR(20),
                status VARCHAR(20) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // 建立 Purchase Requests 表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_requests (
                id SERIAL PRIMARY KEY,
                pr_number VARCHAR(50) UNIQUE NOT NULL,
                item_name VARCHAR(100) NOT NULL,
                quantity INTEGER NOT NULL,
                unit VARCHAR(20) DEFAULT 'pcs',
                requester VARCHAR(100),
                status VARCHAR(20) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Database tables checked/created successfully.");
    } catch (err) {
        console.error("Error initializing database:", err);
    }
};
initDB();

// --- Routes ---

// 首頁
app.get('/', (req, res) => {
    res.render('index'); 
});

// === 1. Suppliers CRUD (Views 資料夾: views/suppliers) ===
app.get('/suppliers', async (req, res) => {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY id ASC');
    res.render('suppliers/index', { suppliers: result.rows });
});

app.get('/suppliers/create', (req, res) => {
    res.render('suppliers/create');
});

app.post('/suppliers', async (req, res) => {
    const { company_name, contact_person, email, phone } = req.body;
    await pool.query(
        'INSERT INTO suppliers (company_name, contact_person, email, phone) VALUES ($1, $2, $3, $4)',
        [company_name, contact_person, email, phone]
    );
    res.redirect('/suppliers');
});

app.get('/suppliers/:id/edit', async (req, res) => {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    res.render('suppliers/edit', { supplier: result.rows[0] });
});

app.put('/suppliers/:id', async (req, res) => {
    const { company_name, contact_person, email, phone, status } = req.body;
    await pool.query(
        'UPDATE suppliers SET company_name=$1, contact_person=$2, email=$3, phone=$4, status=$5 WHERE id=$6',
        [company_name, contact_person, email, phone, status, req.params.id]
    );
    res.redirect('/suppliers');
});

app.delete('/suppliers/:id', async (req, res) => {
    await pool.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
    res.redirect('/suppliers');
});

// === 2. Purchase Requests CRUD (Views 資料夾: views/purchase) ===
app.get('/purchase', async (req, res) => {
    const result = await pool.query('SELECT * FROM purchase_requests ORDER BY created_at DESC');
    res.render('purchase/index', { prs: result.rows });
});

app.get('/purchase/create', (req, res) => {
    res.render('purchase/create');
});

app.post('/purchase', async (req, res) => {
    const { pr_number, item_name, quantity, unit, requester } = req.body;
    await pool.query(
        'INSERT INTO purchase_requests (pr_number, item_name, quantity, unit, requester) VALUES ($1, $2, $3, $4, $5)',
        [pr_number, item_name, quantity, unit, requester]
    );
    res.redirect('/purchase');
});

app.get('/purchase/:id/edit', async (req, res) => {
    const result = await pool.query('SELECT * FROM purchase_requests WHERE id = $1', [req.params.id]);
    res.render('purchase/edit', { pr: result.rows[0] });
});

app.put('/purchase/:id', async (req, res) => {
    const { item_name, quantity, unit, requester, status } = req.body;
    await pool.query(
        'UPDATE purchase_requests SET item_name=$1, quantity=$2, unit=$3, requester=$4, status=$5 WHERE id=$6',
        [item_name, quantity, unit, requester, status, req.params.id]
    );
    res.redirect('/purchase');
});

app.delete('/purchase/:id', async (req, res) => {
    await pool.query('DELETE FROM purchase_requests WHERE id = $1', [req.params.id]);
    res.redirect('/purchase');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});