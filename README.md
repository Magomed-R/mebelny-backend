<h1>Server</h1>
<h2>Установка</h2>
<ol>
<li>Вставь .env-файл</li>
<li>Введи команду: <code>npm i</code></li>
</ol>
<h2>Запуск</h2>
<ol>
<li>Введи команду: <code>npm start</code></li>
</ol>
<h2>Routes</h2>

 Метод | Роут | Параметры (в body при методах POST/PUT, в запросе при методе GET) | Описание | Требует админских прав 
 --- | --- | --- | --- | --- 
POST | <code>/signup</code> | mail, username, password | Возвращает токен, который в дальнейшем необходимо прикладывать в хедерах запросов в виде Authorization: "Bearer :your token:" | ➖
POST | <code>/login</code> | mail, password | Возвращает токен, который в дальнейшем необходимо прикладывать в хедерах запросов в виде Authorization: "Bearer :your token:" | ➖
GET | <code>/furniture/all</code> | sort=date, manufacturer, tags | возвращает массив со всей мебелью | ➖
POST | <code>/furniture/new</code> | title, adminTitle, preview, price, photos, description, characteristics, tags, manufacturer, discount | добавляет новый объект в коллекцию "мебель" | ✅
POST | <code>/furniture/edit</code> | id, title, adminTitle, description, price, preview, photos, characteristics, tags, manufacturer, discount | изменяет один объект коллекции "мебель" | ✅
POST | <code>/furniture/delete</code> | id | удаляет один объект в коллекции "мебель" | ✅
POST | <code>/ask</code> | username, number, city, comment | отправляет обращение админу | ➖
POST | <code>/order</code> | ➖ | передаёт текущее составляющее корзины пользователя в новый заказ, отправляет уведомление сотрудникам магазина, передаёт данные в админку | ➖
GET | <code>/users/all</code> | ➖ | возвращает всех пользователей | ✅
GET | <code>/users/one</code> | ➖ | возвращает одного пользователя. id пользователя берётся из токена | ➖
POST | <code>/users/edit</code> | username, mail, number, address | изменяет данные пользователя. _id пользователя берётся из токена | ➖
POST | <code>/users/delete</code> | ➖ | удаляет пользователя | ➖
POST | <code>/cart/add</code> | id | добавляет товар в корзину пользователя. _id пользователя достаётся из токена | ➖
POST | <code>/cart/delete</code> | id | удаляет товар из корзины пользователя. _id пользователя достаётся из токена | ➖
POST | <code>/cart/plus</code> | id | добавляет 1 единицу к свойству count товара из корзины пользователя | ➖
POST | <code>/cart/minus</code> | id | отнимает 1 единицу от свойства count товара из корзины пользователя | ➖
POST | <code>/cart/clear</code> | ➖ | очищает корзину пользователя | ➖
GET | <code>/purchase/all</code> | ➖ | возвращает историю всех заказов от пользователей | ✅
POST | <code>/purchase/complete</code> | id, status | изменяет статус заказа. Свойство status имеет 2 возможных значения: success и fail | ✅
POST | <code>/block</code> | id | блокирует пользователя | ✅
POST | <code>/unblock</code> | id | разблокирывает пользователя | ✅
GET | <code>/filter/all</code> | ➖ |возвращает все теги и всех производителей | ➖
POST | <code>/files/install</code> | files | передаёт статические файлы на сервер. Возвращает массив с id фото\видео, через которое затем можно получить файлы по url | ✅
PUT | <code>/sale</code> | manufacturer, sale | добавляет в поля sale во всех товаров с производителем :manufacturer: указанную в :sale: скидку | ✅
</ul>
<h2>Структура коллекций</h2>
<h3>Схема мебели</h3>

```javascript
{
        title: String
        adminTitle: String,
        price: Number,
        preview: String,
        photos: [String],
        description: String,
        characteristics: [{
                name: String,
                text: String,
        }],
        tags: String,
        manufacturer: String,
        isDeleted: Boolean,
        sale: Number
        discount: Number
}
```

<h3>Схема производителя</h3>

```javascript
{
    manufacturer: String,
    sale: Number
}
```

<h3>Схема пользователя</h3>

```javascript
{
        username: String,
        password: String,
        number: String,
        mail: String,
        cart: [{
                furniture: Object,
                count: Number
        }],
        address: String,
        role: String,
        historyOfBye: [Object],
        historyOfview: [Object],
        isBlocked: Boolean,
        createdAt: Date,
        updatedAt: Date
}
```

<h3>Схема истории покупок</h3>

```javascript
{
        ticket: String,
        buyer: Object,
        purchase: [
            {
                furniture: Object,
                count: Number
            }
        ],
        status: String,
        createdAt: Date,
        updatedAt: Date
}
```

<h3>Схема заблокированных ip</h3>

```javascript
{
        ip: String
        createdAt: Date,
        updatedAt: Date
}
```
