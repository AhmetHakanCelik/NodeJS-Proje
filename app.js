const db = require("./src/config/db.js");
const ogrencisayac = require("./src/models/ogrenciSayac.js");
const bolumRoute = require("./src/routes/bolumrouter.js");
const ogrenciRoute = require("./src/routes/ogrencirouter.js");
const haftalikRaporlama = require("./src/routes/raporlama.js");

const express = require("express");
const User = require("./src/models/user.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authToken = require("./src/models/authenticate_token.js");

const bodyParser = require("body-parser");

const App = express();
App.use(express.json());
App.use(express.urlencoded({ extended: true }));
App.use(bodyParser.urlencoded({ extended: true }));
App.use(bodyParser.json());

async function main() {
  try {
    db.sync();
    db.afterSync("afterSync", async () => {
      const rowCount = await ogrencisayac.count();
      if (rowCount === 0) {
        await ogrencisayac.create({ initialValue: 0 });
      }
    });
    App.use("/bolum", authToken, bolumRoute);
    App.use("/ogrenci", authToken, ogrenciRoute);
    haftalikRaporlama();

    App.post("/register", async (req, res) => {
      const { username, password } = req.body;

      try {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
        const hashedPassword = bcrypt.hashSync(password, 10);

        await User.create({ username, password: hashedPassword });
        res.status(201).json({ message: "User registered successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    App.post("/login", async (req, res) => {
      const { username, password } = req.body;

      try {
        const user = await User.findOne({ where: { username } });

        if (!user || !bcrypt.compareSync(password, user.password)) {
          return res
            .status(401)
            .json({ message: "Invalid username or password" });
        }
        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "1m",
          }
        );
        res.status(200).send({ auth: true, token });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    // later delete this section
    App.get("/user", async (req, res) => {
      try {
        const users = await User.findAll();

        res.json(users);
      } catch (error) {
        console.error(error);
        res.status(500).send("Sunucu hatası");
      }
    });

    App.listen(process.env.PORT1, () => {
      console.log(
        `Sunucu ${process.env.PORT1} numaralı porta başarıyla bağlandı.`
      );
    });
  } catch (error) {
    console.error("İşlem sırasında bir hata oluştu:", error);
  }
}

main();
