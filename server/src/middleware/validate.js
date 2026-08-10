export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, convert: true });
    if (error) {
      const message = error.details.map((d) => d.message.replace(/"/g, '')).join(', ');
      return res.status(400).json({ message });
    }
    req.body = value;
    next();
  };
}

export function paramInt(name, { positive = true } = {}) {
  return (req, res, next) => {
    const raw = req.params[name];
    const num = Number(raw);
    if (raw === undefined || !Number.isInteger(num) || (positive && num <= 0)) {
      return res.status(400).json({ message: `Invalid ${name} parameter` });
    }
    req.params[name] = num;
    next();
  };
}
