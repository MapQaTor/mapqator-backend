const Pool = require("pg").Pool;
const cache = require("node-cache");
const mycache = new cache({
	deleteOnExpire: true,
	stdTTL: 5 * 60,
});
// require("dotenv").config({
// 	path: `.env${process.env.NODE_ENV ? "." + process.env.NODE_ENV : ""}`,
// });
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
				options: "-c search_path=public", // ALTER ROLE postgres SET search_path = my_schema, "$user", public;
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
	const result = await query("SELECT * FROM users", []);
	return result;
};

startTransaction = async () => {
	await query("BEGIN");
};

endTransaction = async () => {
	await query("COMMIT");
};

rollbackTransaction = async () => {
	await query("ROLLBACK");
};

query_redis = async (key, q, params) => {
	let data = await get_redis(key);
	if (data != null) {
		return JSON.parse(data);
	}
	let result = await query(q, params);
	if (result.success) await set_redis(key, JSON.stringify(result));
	return result;
};

set_redis = async function (key, data) {
	try {
		if (key != null && data != null) {
			console.log("setting cache", key);
			mycache.set(key, data);
		}
		return true;
	} catch (e) {
		return false;
	}
};

get_redis = async function (key) {
	try {
		if (key != null) {
			const data = mycache.get(key);
			if (data != null) {
				console.log("cache hit", key);
				return data;
			}
		}
	} catch (error) {
		return null;
	}
};

delete_redis = async function (keys) {
	try {
		console.log("deleting key", keys);
		mycache.del(keys);
		return;
	} catch (error) {
		return;
	}
};

module.exports = {
	query,
	check,
	startTransaction,
	endTransaction,
	rollbackTransaction,
	query_redis,
	set_redis,
	get_redis,
	delete_redis,
};
