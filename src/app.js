import dotenv from "dotenv";

dotenv.config();

import express from "express";

const app = express();
const port = process.env.PORT || 3000;

import mongoose from "mongoose";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

import cors from "cors";

app.use(cors({ origin: process.env.CLIENT_URL || `http://localhost:3000` }));

import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";

import chalk from "chalk";

import crypto from "crypto";

function stringToNumber(string) {
    const hash = crypto.createHash("sha256");
    hash.update(string);
    const hashedString = hash.digest("hex");
    const number = BigInt(`0x${hashedString}`);
    return number.toString().slice(0, 12);
}

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import multer from "multer";
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + "/uploads");
    },
    filename: function (req, file, callback) {
        console.log(file.originalname);
        callback(null, stringToNumber(file.originalname) + ".png");
    },
});
const upload = multer({ storage: storage });

try {
    app.listen(port, () => {
        console.log(chalk.bold.green(`Server started on port ${port}`));
    });
    mongoose
        .connect(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster.dvfjqpc.mongodb.net/devfurnshop`)
        .then((res) => console.log(chalk.bold.green("Connected to DB")))
        .catch((error) => console.log(error));
} catch (error) {
    console.log(error);
}

import User from "./Models/User.js";
import Furniture from "./Models/Furniture.js";
import Purchase from "./Models/Purchase.js";
import Block from "./Models/Block.js";
import Manufacturer from "./Models/Manufacturer.js";
import Tags from "./Models/Tags.js";

import mailer from "./nodemailer.js";
import { count } from "console";

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json("Internal Server Error");
});

const blockIPMiddleware = async (req, res, next) => {
    const clientIP = req.ip;

    let blocks = await Block.find();

    let blockedIPs = blocks.map((block) => {
        return block.ip;
    });

    if (blockedIPs.includes(clientIP)) return res.status(403).json("Вы заблокированы администраторами");

    next();
};

app.use(blockIPMiddleware);

function authenticateCheck(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json("Не зарегистрирован");

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (error, user) => {
        if (error) {
            console.log(error);
            return res.sendStatus(403);
        }

        let account = await User.findOne({ _id: user.id });
        if (!account) return res.status(401).json("Не зарегистрирован");
        if (account.isBlocked) {
            let newBlock = new Block({
                ip: req.ip,
            });

            await newBlock.save();

            return res.status(403).json("Аккаунт заблокирован");
        }

        req.user = account;
        next();
    });
}

app.use(express.static("src/uploads"));

app.post(`/signup`, async (req, res) => {
    let { username, password, mail, number, cart } = req.body;

    if (!mail || !username || !password || !number) return res.status(406).json("Не все обязательные поля заполнены");

    try {
        let user = await User.findOne({ mail: mail });

        if (user) return res.status(406).json("Почта уже используется на другом аккаунте");
        if (password.length < 4) return res.status(406).json("Пароль слишком короткий");
        if (!mail.includes("@") || !mail.includes(".")) return res.status(406).json("Неккоректный адрес почты");
        if (!cart) cart = [];
        else {
            cart.forEach((element) => {
                element.furniture = element._id;
            });
        }

        let hashedPassword = await bcrypt.hash(password, 7);

        let newUser = new User({
            username: username,
            password: hashedPassword,
            mail: mail,
            number: number,
            cart: cart,
            address: "",
            historyOfBye: [],
            historyOfview: [],
        });

        await newUser.save();

        mailer(mail, "Аккаунт создан", `Добро пожаловать, ${username}!<br />Пароль от аккаунта: ${password}`);

        user = await User.findOne({ mail: mail });
        let data = { id: user.id };

        let accessToken = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET);

        res.json({ accessToken: accessToken, user: user });
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.post(`/login`, async (req, res) => {
    let { mail, password, cart } = req.body;

    if (!mail || !password) return res.status(406).json("Не все обязательные поля заполнены");

    try {
        let user = await User.findOne({ mail: mail });

        if (!user) return res.status(404).json("Аккаунт не найден");
        else if (!(await bcrypt.compare(password, user.password))) return res.status(403).json("Пароль неверный");
        else {
            if (cart?.length == 0) {
            } else if (user.cart.length == 0 && cart) {
                cart.forEach((element) => {
                    element.furniture = element._id;
                });
                
                user.cart = cart;
                user.save();
            } else if (user.cart.length == 0) {
            } else if (user.cart.length && cart) {
                cart.forEach((element) => {
                    element.furniture = element._id;
                });

                let result = {};

                for (let i = 0; i < user.cart.length; i++) {
                    result[user.cart[i].furniture] = user.cart[i].count;
                }

                for (let i = 0; i < cart.length; i++) {
                    result[cart[i].furniture] = cart[i].count;
                }

                let keys = Object.keys(result);

                user.cart = []
                for (let i = 0; i < keys.length; i++) {
                    user.cart.push({ furniture: keys[i], count: result[keys[i]] });
                }

                user.save();
            }

            let data = { id: user._id };
            const accessToken = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET);

            res.json({ accessToken: accessToken, user: user });
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.get("/users/all", authenticateCheck, async function (req, res) {
    if (req.user?.role != "admin") return res.status(403).json("Доступ запрещён");

    try {
        let users = await User.find().populate("cart.furniture").populate("historyOfBye").populate("historyOfview");

        res.json(users);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.get("/users/one", authenticateCheck, async function (req, res) {
    try {
        let user = await User.findOne({ _id: req.user._id }).populate("cart.furniture").populate("historyOfBye").populate("historyOfview");
        await user.populate("historyOfBye.purchase.furniture");

        res.json(user);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.post(`/users/edit`, authenticateCheck, async (req, res) => {
    let { username, mail, number, address } = req.body;

    if (!mail || !username) return res.status(406).json("Не все обязательные поля заполнены");
    if (!mail.includes("@") || !mail.includes(".")) return res.status(406).json("Неккоректный адрес почты");
    if (number) {
        if (number?.length != 12 || !number?.includes("+7")) return res.status(406).json("Некорректный номер телефона");
    }

    try {
        let user = await User.findOne({ _id: req.user?._id });

        user.username = username;
        user.mail = mail;
        user.address = address;
        user.number = number;

        await user.save();

        return res.json(user);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.post("/users/delete", authenticateCheck, async function (req, res) {
    try {
        await User.deleteOne({ _id: req.user?._id });

        res.sendStatus(200);
    } catch (error) {
        console.log(error);
    }
});

app.post("/cart/add", authenticateCheck, async function (req, res) {
    let { id } = req.body;

    if (!id) return res.status(406).json("Не все обязательные поля заполнены");

    try {
        let user = await User.findOne({ _id: req.user._id });

        if (!user) return res.status(404).json("Аккаунт не найден");

        let checkUser = user.cart.map((el) => el.furniture.toString());

        if (!checkUser.includes(id)) {
            user.cart.push({
                furniture: id,
            });
            await user.save();
        }

        await user.populate("cart.furniture");

        return res.json(user);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.post("/cart/delete", authenticateCheck, async function (req, res) {
    let { id } = req.body;

    if (!id) return res.status(406).json("Не все обязательные поля заполнены");

    try {
        let user = await User.findOne({ _id: req.user._id });

        if (!user) return res.status(404).json("Аккаунт не найден");

        let index = user.cart.findIndex((item) => item.furniture == id);
        if (index != -1) {
            user.cart.splice(index, index + 1);
            await user.save();
        }

        await user.populate("cart.furniture");

        return res.json(user);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.post("/cart/plus", authenticateCheck, async function (req, res) {
    let { id } = req.body;

    if (!id) return res.status(406).json("Не все обязательные поля заполнены");

    try {
        let user = await User.findOne({ _id: req.user._id }).populate("cart.furniture");

        if (!user) return res.status(404).json("Аккаунт не найден");

        let index = user.cart.findIndex((item) => item.furniture._id == id);
        if (index != -1) {
            user.cart[index].count++;
            await user.save();
        }

        return res.json(user);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.post("/cart/minus", authenticateCheck, async function (req, res) {
    let { id } = req.body;

    if (!id) return res.status(406).json("Не все обязательные поля заполнены");

    try {
        let user = await User.findOne({ _id: req.user._id }).populate("cart.furniture");

        if (!user) return res.status(404).json("Аккаунт не найден");

        let index = user.cart.findIndex((item) => item.furniture._id == id);
        if (user.cart[index].count <= 1) return res.status(406).json("Установлено минимальное кол-во");
        if (index != -1) {
            user.cart[index].count--;
            await user.save();
        }

        return res.json(user);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.post("/cart/clear", authenticateCheck, async function (req, res) {
    try {
        let user = await User.findOne({ _id: req.user._id });

        if (!user) return res.status(404).json("Аккаунт не найден");

        user.cart = [];
        await user.save();

        return res.json(user);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.get("/furniture/all", async function (req, res) {
    try {
        let sort = req.query?.sort?.toLowerCase();
        let tags = req.query?.tags;
        let manufacturer = req.query?.manufacturer?.toLowerCase();

        let furniture = [];

        let query = {
            isDeleted: false,
        };
        if (tags) {
            query.tags = tags;
        }
        if (manufacturer) {
            query.manufacturer = manufacturer;
        }
        let sortQuery = sort == "date" ? { createdAt: -1 } : {};
        furniture = await Furniture.find(query).sort(sortQuery);

        return res.json(furniture);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.get("/furniture/one", async function (req, res) {
    if (!req.query.id) return res.status(404).json("отсутствует ID");

    try {
        let furniture = await Furniture.findOne({ _id: req.query.id, isDeleted: false });

        if (!furniture) return res.status(404).json("Мебель не найдена");

        return res.json(furniture);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.post("/files/install", authenticateCheck, upload.array("files"), async function (req, res) {
    if (req.user?.role != "admin") return res.status(403).json("Доступ запрещён");

    try {
        console.log("files:", req.files);

        let result = [];
        for (let i = 0; i < req.files.length; i++) {
            result.push(stringToNumber(req.files[i].originalname) + ".png");
        }
        return res.status(200).json(result);
    } catch (error) {
        console.log(error);

        res.status(500).json("Произошла ошибка при загрузке файлов");
    }
});

app.post("/furniture/new", authenticateCheck, async function (req, res) {
    if (req.user?.role != "admin") return res.status(403).json("Доступ запрещён");

    try {
        let { title, adminTitle, description, price, characteristics, tags, manufacturer, preview, photos, discount } = req.body;

        if (!title || !price) return res.status(406).json("Не все обязательные поля заполнены");
        // if (!req.files.preview || !req.files.photos) res.status(406).json("Отсутствуют фото и превью");

        // let photos = req.files.photos.map((el) => el.originalname);

        let furniture = new Furniture({
            title: title,
            adminTitle: adminTitle,
            description: description,
            price: price,
            // preview: req.files.preview[0].originalname,
            discount: discount,
            preview: preview,
            photos: photos,
            characteristics: characteristics,
            tags: tags,
            manufacturer: manufacturer?.toLowerCase(),
        });

        await furniture.save();

        res.sendStatus(200);
    } catch (error) {
        console.log(error);

        res.sendStatus(405);
    }
});

app.post("/furniture/edit", authenticateCheck, async function (req, res) {
    if (req.user?.role != "admin") return res.status(403).json("Доступ запрещён");
    if (!req.body.id) return res.status(404).json("отсутствует ID");

    try {
        let { id, title, adminTitle, description, price, characteristics, tags, manufacturer, preview, photos, discount } = req.body;

        if (!title || !price) return res.status(406).json("Не все обязательные поля заполнены");
        // if (!req.files.preview || !req.files.photos) res.status(406).json("Отсутствуют фото и превью");

        let furniture = await Furniture.findOne({ _id: id, isDeleted: false });

        if (!furniture) return res.status(404).json("Мебель не найдена");

        // let photos = req.files.photos.map((el) => el.originalname);

        furniture.title = title;
        furniture.adminTitle = adminTitle;
        furniture.description = description;
        furniture.price = price;
        furniture.preview = preview;
        furniture.photos = photos;
        furniture.discount = discount;
        furniture.characteristics = characteristics;
        furniture.tags = tags;
        furniture.manufacturer = manufacturer?.toLowerCase();

        await furniture.save();

        let checkManufacturer = await Manufacturer.findOne({ manufacturer: manufacturer });

        if (!checkManufacturer) {
            let newManufacturer = new Manufacturer({
                manufacturer: manufacturer,
            });

            await newManufacturer.save();
        }

        let checkTag = await Tags.findOne({ tag: tags });

        if (!checkTag) {
            let newTag = new Tags({
                manufacturer: manufacturer,
            });

            await newTag.save();
        }

        res.sendStatus(200);
    } catch (error) {
        console.log(error);

        res.sendStatus(405);
    }
});

app.post("/furniture/delete", authenticateCheck, async function (req, res) {
    if (req.user?.role != "admin") return res.status(403).json("Доступ запрещён");
    if (!req.body.id) return res.status(404).json("отсутствует ID");

    try {
        let furniture = await Furniture.findOne({ _id: req.body.id, isDeleted: false });

        furniture.isDeleted = true;

        await furniture.save();

        res.sendStatus(200);
    } catch (error) {
        console.log(error);

        res.sendStatus(405);
    }
});

app.post("/ask", authenticateCheck, async function (req, res) {
    let { number, comment, username, city } = req.body;

    if (!username || !number) return res.status(406).json("Не все обязательные поля заполнены");

    if (number.length != 12 || !number.includes("+7")) return res.status(406).json("Некорректный номер телефона");
    console.log(req.body);

    try {
        mailer(
            process.env.ADMIN_MAIL,
            "Новое обращение",
            `От: ${username}<br />Номер телефона: ${number}<br />Город: ${city ? city : "не указан"}<br />Комментарий: ${
                comment ? comment : "отсутствует"
            }`
        );

        res.json("Обращение отправлено");
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.post("/order", authenticateCheck, async function (req, res) {
    try {
        let user = await User.findOne({ _id: req.user._id }).populate("cart.furniture");

        if (!user.number) return res.status(406).json("Прикрепите свой номер телефона в настройках аккаунта для осуществления заказа");

        let purchase = "<ol>";
        for (let i = 0; i < user.cart.length; i++) {
            purchase += `<li>Название:  ${user.cart[i].furniture.title};<br /> Админ-название: ${user.cart[i].furniture?.adminTitle};<br/>кол-во: ${user.cart[i].count}; </li>`;
        }
        purchase += "</ol>";

        let ticket = Math.random() * 1000000000;
        ticket = ticket.toString().slice(0, 5);

        mailer(
            process.env.ADMIN_MAIL,
            "Новый заказ",
            `Номер заказа: ${ticket}<br />От: ${user.username}<br />Номер телефона: ${user.number}<br />Адрес: ${
                user?.address ? user?.address : "не указан"
            }<br />Заказ: ${purchase}`
        );

        let newPurchase = new Purchase({
            ticket: ticket,
            buyer: user._id,
            purchase: user.cart,
        });

        await newPurchase.save();

        let buy = await Purchase.findOne({ ticket: ticket });

        user.cart = [];
        user.historyOfBye.push(buy._id);

        await user.save();

        mailer(
            user.mail,
            "Заказ принят",
            `Ваш заказ под номером ${ticket} принят и в данный момент находится в обработке. В ближайшее время с вами свяжутся наши сотрудники`
        );

        return res.json(user);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.get("/purchase/all", authenticateCheck, async function (req, res) {
    if (req.user?.role != "admin") return res.status(403).json("Доступ запрещён");

    try {
        let purchases = await Purchase.find().populate("buyer").populate("purchase.furniture");

        return res.json(purchases);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.post("/purchase/complete", authenticateCheck, async function (req, res) {
    if (req.user?.role != "admin") return res.status(403).json("Доступ запрещён");

    let { id, status } = req.body;

    if (!id || !status) return res.status(404).json("Отсутствует id заказа или status");

    try {
        let purchase = await Purchase.findOne({ _id: id }).populate("buyer").populate("purchase.furniture");

        if (status == "success") {
            purchase.status = "Успешно";
            await purchase.save();
        } else if (status == "fail") {
            purchase.status = "Отменено";
            await purchase.save();
        }

        return res.json(purchase);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.get("/filter/all", async function (req, res) {
    try {
        let manufacturers = await Manufacturer.find();
        let tags = await Tags.find();

        manufacturers = manufacturers.map((el) => el.manufacturer);
        tags = tags.map((el) => el.tag);

        res.json({ tags: tags, manufacturers: manufacturers });
    } catch (error) {
        console.log(error);
    }
});

app.post("/block", authenticateCheck, async function (req, res) {
    if (req.user.role != "admin") return res.status(403).json("Доступ запрещён");

    let { id } = req.body;
    if (!id) return res.status(404).json("отсутствует ID");
    try {
        let user = await User.findOne({ _id: id });

        if (!user) return res.status(404).json("Аккаунт не найден");

        user.isBlocked = true;
        await user.save();

        res.sendStatus(200);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.post("/unblock", authenticateCheck, async function (req, res) {
    if (req.user.role != "admin") return res.status(403).json("Доступ запрещён");

    let { id } = req.body;
    if (!id) return res.status(404).json("отсутствует ID");
    try {
        let user = await User.findOne({ _id: id });

        if (!user) return res.status(404).json("Аккаунт не найден");

        user.isBlocked = false;
        await user.save();

        res.sendStatus(200);
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});

app.put("/sale", authenticateCheck, async function (req, res) {
    if (req.user.role != "admin") return res.status(403).json("Доступ запрещён");

    let { manufacturer, sale } = req.body;
    try {
        let furnitures = await Furniture.find({ manufacturer: manufacturer });

        if (!furnitures.length) return res.sendStatus(404);

        for (let i = 0; i < furnitures.length; i++) {
            let id = furnitures[i]._id;
            let furniture = await Furniture.findOne({ _id: id });

            furniture.sale = sale;
            furniture.save();
        }

        res.send({ message: `Изменено ${furnitures.length} моделей мебели` });
    } catch (error) {
        console.log(error);

        res.sendStatus(500);
    }
});
