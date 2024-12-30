# MapQaTor Backend

## Project Setup

Follow the step by step installation procedure to install and run this on your machine.

## Prerequisites

Make sure you have node and postgresql installed in your device.

**`NodeJs`**: Install Nodejs from [here](https://nodejs.org/en/download/) \
**`PostgreSQL`** Install PostgreSQL from [here](https://www.postgresql.org/download/)


## Installation <a name="configuration"></a>

1.  Clone the repo

```sh
git clone https://github.com/mapqator/mapqator-backend.git
```

2.  If you don't have git installed in your device then download zip
3.  After installation or download go to the repository and open command line.

### Configuring Backend

Install NPM packages

```sh
npm install
```

### Configuring Database

```sh
psql -U postgres -c "CREATE DATABASE mapqator;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE mapqator TO postgres;"
psql -U postgres -d mapqator -a -f schema.sql
```

An empty database will be created with the name `mapqator` and the schema will be created. You need to create an user to login to the website. For that you need to add an entry in the `users` table.

```sh
psql -U postgres -d mapqator -c "INSERT INTO users (username, password) VALUES ('your_username', '******');"
```

Replace `******` with the hashed password. You can use the following command to generate a hashed password.

```sh
node services\password.js your_password
```

### Setting up the environment variables

Rename the `.env.example` file to `.env` and update the values as per your configuration.

We are finally good to go.

### Run the project

Go to your favourite code editor and run

```sh
npm start
```

You should find that the project is working!