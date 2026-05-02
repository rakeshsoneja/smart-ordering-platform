const express = require('express');
const { query } = require('../database/dbConnection');

const router = express.Router();

/**
 * GET /api/config
 * Public: first active store name + logo URL for storefront branding.
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT name, logo_url
       FROM stores
       WHERE is_active = true
       ORDER BY id ASC
       LIMIT 1`
    );
    const row = result.rows[0];
    res.json({
      name: row?.name != null ? String(row.name) : '',
      logo_url: row?.logo_url != null ? String(row.logo_url) : '',
    });
  } catch (error) {
    console.error('GET /api/config error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to load store configuration',
    });
  }
});

module.exports = router;
