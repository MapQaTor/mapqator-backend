const Pool = require("pg").Pool;
require("dotenv").config();

query = async (query, params) => {
  let result;
  // console.log(process.env.NODE_ENV, DB_HOST, process.env.DB_HOST);
  try {
    if (this.pool === undefined) {
      this.pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DB,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
        // ssl: {
        //   rejectUnauthorized: false,
        // },
      });
      console.log("POOL CREATED");
    }
    result = await this.pool.query(query, params);
    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.log("COULD NOT CONNECT TO PG");
    console.log(error);
    console.log(query, params);
    return {
      success: false,
      error: error,
    };
  }
};

check = async () => {
  const result = await query("SELECT version();", []);
  return result;
};

module.exports = {
  query,
  check,
};
