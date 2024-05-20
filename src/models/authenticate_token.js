const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(403).send({ auth: false, message: "Token gerekli" });
  }

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Erişim izniniz yok" });
    }

    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
