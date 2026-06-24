# DiscountCardsAPI — описание HTTP-сервиса

Документ для интеграции внешнего приложения с сервисом дисконтных карт.

## Базовый URL

Сервис публикуется в 1С с корневым путём `discount_cards_api`.

```
https://<хост>/<имя_публикации>/hs/discount_cards_api/...
```

Конкретные значения хоста, имени публикации и схемы (HTTP/HTTPS) будут предоставлены отдельно.

## Авторизация

Для всех запросов используется **HTTP Basic Authentication**.

Передайте заголовок:

```
Authorization: Basic <base64(login:password)>
```

где `login:password` — логин и пароль пользователя 1С, закодированные в Base64.

Логин и пароль будут переданы разработчику отдельно.

Пример (псевдокод):

```
credentials = Base64Encode("login" + ":" + "password")
Authorization: Basic " + credentials
```

При отсутствии или неверных учётных данных сервер вернёт **HTTP 401 Unauthorized**.

## Общие правила

| Параметр | Значение |
|---|---|
| Формат данных | JSON |
| Кодировка | UTF-8 |
| Заголовок запроса (POST) | `Content-Type: application/json` |
| Заголовок ответа | `Content-Type: application/json; charset=utf-8` |

### Формат всех ответов

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

| Поле | Тип | Описание |
|---|---|---|
| `success` | boolean | `true` — успех, `false` — ошибка |
| `data` | object / null | Полезные данные |
| `error` | string / null | Текст ошибки при `success: false` |

HTTP-код ответа: **200** при успехе, **404** или **500** при ошибках.

---

## 1. Создание дисконтной карты

**POST** `/card`

### Тело запроса

```json
{
  "client_name": "Иван Иванов",
  "phone_number": "+79001234567"
}
```

| Поле | Обязательное | Описание |
|---|---|---|
| `client_name` | да | ФИО / имя клиента |
| `phone_number` | да | Номер телефона клиента |

### Успешный ответ — HTTP 200

```json
{
  "success": true,
  "data": {
    "card_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "card_number": "1234567890123",
    "card_discount": 5,
    "client_name": "Иван Иванов"
  },
  "error": null
}
```

| Поле в `data` | Описание |
|---|---|
| `card_id` | Идентификатор карты |
| `card_number` | Номер (код) дисконтной карты |
| `card_discount` | Процент скидки |
| `client_name` | Имя владельца карты |

### Ошибки

| HTTP | `error` |
|---|---|
| 500 | `Failed to create contractor` |
| 500 | `Failed to create discount card` |

---

## 2. Получение карты по номеру

**GET** `/card/{card_number}`

### Параметры URL

| Параметр | Описание |
|---|---|
| `card_number` | Номер (код) дисконтной карты |

### Пример

```
GET /hs/discount_cards_api/card/1234567890123
```

### Успешный ответ — HTTP 200

Формат `data` такой же, как при создании карты.

### Ошибки

| HTTP | `error` |
|---|---|
| 404 | `Discount card not found` |

---

## 3. Удаление карты

**DELETE** `/card/{card_number}`

### Параметры URL

| Параметр | Описание |
|---|---|
| `card_number` | Номер (код) дисконтной карты |

### Пример

```
DELETE /hs/discount_cards_api/card/1234567890123
```

### Успешный ответ — HTTP 200

```json
{
  "success": true,
  "data": null,
  "error": null
}
```

### Ошибки

| HTTP | `error` |
|---|---|
| 404 | `Discount card not found` |
| 500 | `Failed to delete discount card` |

---

## Примеры запросов (cURL)

### Создание карты

```bash
curl -X POST "https://example.com/base/hs/discount_cards_api/card" \
  -u "login:password" \
  -H "Content-Type: application/json" \
  -d "{\"client_name\":\"Иван Иванов\",\"phone_number\":\"+79001234567\"}"
```

### Получение карты

```bash
curl -X GET "https://example.com/base/hs/discount_cards_api/card/1234567890123" \
  -u "login:password"
```

### Удаление карты

```bash
curl -X DELETE "https://example.com/base/hs/discount_cards_api/card/1234567890123" \
  -u "login:password"
```

---

## Замечания для интеграции

1. Проверяйте и поле `success` в теле ответа, и HTTP-код.
2. Для POST обязателен заголовок `Content-Type: application/json`.
3. Все запросы должны содержать корректный заголовок `Authorization` (Basic Auth).

http://37.233.5.127/BestOption
Логин: DiscountCardMobile
Пароль: 1

Пример обращения к сервису:

http://37.233.5.127/BestOption/hs/discount_cards_api/card/1234567890