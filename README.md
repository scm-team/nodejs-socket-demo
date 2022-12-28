# Node.js Socket Demo

### Installation

Clone the repo:
```
git clone https://github.com/scm-team/nodejs-socket-demo.git
cd nodejs-socket-demo
```

Install NPM dependencies:
```
npm install
```

Create Database and import table
```
mysql -u DB_USERNAME -p DATABASE_NAME < database/db.sql
```

Setup configuration:
```
cp.env.example .env
```

Start Server
```
npm run start
```

Stop Server
```
npm run stop
```

### Usage

Driver View
```
http://localhost:4000/driver.html
```

Client View
```
http://localhost:4000/client.html
```

### Todo
- migration
- error log
- multiple emit
