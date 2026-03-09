# API Quick Testing Guide

Base URL: `http://localhost:5000`

## 1. Register
`POST /api/auth/register`
```json
{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "123456"
}
```

## 2. Login
`POST /api/auth/login`
```json
{
  "email": "admin@test.com",
  "password": "123456"
}
```
Use returned `token` as:
`Authorization: Bearer <token>`

## 3. Seed temples (admin)
`POST /api/temples/seed/init`

## 4. Get temples
`GET /api/temples`

## 5. Book pass
`POST /api/passes/book`
```json
{
  "templeId": "<temple_id>",
  "pilgrimName": "Saksham",
  "numPilgrims": 2,
  "darshanSlot": "09:00-11:00",
  "visitDate": "2026-03-10"
}
```

## 6. Verify and use pass
- `GET /api/passes/verify/<PASS_CODE>`
- `PATCH /api/passes/use/<PASS_CODE>`

## 7. Join queue
`POST /api/queue/join`
```json
{
  "templeId": "<temple_id>",
  "pilgrimName": "Saksham",
  "phone": "9876543210",
  "darshanSlot": "09:00-11:00"
}
```

## 8. Queue status by token
`GET /api/queue/status/by-token?templeId=<id>&darshanSlot=09:00-11:00&tokenNumber=1`

## 9. Queue operations (admin/staff)
- `POST /api/queue/call-next` body:
```json
{ "templeId": "<temple_id>" }
```
- `POST /api/queue/mark-completed` body:
```json
{ "templeId": "<temple_id>" }
```

## 10. Crowd prediction
`GET /api/prediction/<temple_id>?date=2025-02-26`

