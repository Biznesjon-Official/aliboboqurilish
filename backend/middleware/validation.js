const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validateProduct = (req, res, next) => {
  const { name, price, category } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Valid product name required' });
  }

  if (!price || typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: 'Valid price required' });
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    return res.status(400).json({ error: 'Valid category required' });
  }

  next();
};

const validateOrder = (req, res, next) => {
  const { customerName, customerPhone, items } = req.body;

  if (!customerName || typeof customerName !== 'string') {
    return res.status(400).json({ error: 'Valid customer name required' });
  }

  if (!customerPhone || typeof customerPhone !== 'string') {
    return res.status(400).json({ error: 'Valid phone number required' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one item required' });
  }

  next();
};

module.exports = {
  validateEmail,
  validateProduct,
  validateOrder
};
