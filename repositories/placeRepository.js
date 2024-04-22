const base = require("./base");

const createPlace = async (place) => {
  const query = `INSERT INTO places (place_id, name, formatted_address, geometry, opening_hours, rating, reviews, price_level, types, user_ratings_total, delivery, dine_in, reservable, serves_beer, serves_breakfast, serves_brunch, serves_dinner, serves_lunch, serves_vegetarian_food, serves_wine, takeout, wheelchair_accessible_entrance) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) 
    ON CONFLICT (place_id) DO UPDATE SET 
    name = EXCLUDED.name, 
    formatted_address = EXCLUDED.formatted_address, 
    geometry = EXCLUDED.geometry, 
    opening_hours = EXCLUDED.opening_hours, 
    rating = EXCLUDED.rating, 
    reviews = EXCLUDED.reviews, 
    price_level = EXCLUDED.price_level, 
    types = EXCLUDED.types, 
    user_ratings_total = EXCLUDED.user_ratings_total, 
    delivery = EXCLUDED.delivery, 
    dine_in = EXCLUDED.dine_in, 
    reservable = EXCLUDED.reservable, 
    serves_beer = EXCLUDED.serves_beer, 
    serves_breakfast = EXCLUDED.serves_breakfast, 
    serves_brunch = EXCLUDED.serves_brunch, 
    serves_dinner = EXCLUDED.serves_dinner, 
    serves_lunch = EXCLUDED.serves_lunch, 
    serves_vegetarian_food = EXCLUDED.serves_vegetarian_food, 
    serves_wine = EXCLUDED.serves_wine, 
    takeout = EXCLUDED.takeout, 
    wheelchair_accessible_entrance = EXCLUDED.wheelchair_accessible_entrance
    RETURNING *`;
  const params = [
    place.place_id || null,
    place.name || null,
    place.formatted_address || null,
    place.geometry || null,
    place.opening_hours || null,
    place.rating || null,
    place.reviews || null,
    place.price_level || null,
    place.types || null,
    place.user_ratings_total || null,
    place.delivery || null,
    place.dine_in || null,
    place.reservable || null,
    place.serves_beer || null,
    place.serves_breakfast || null,
    place.serves_brunch || null,
    place.serves_dinner || null,
    place.serves_lunch || null,
    place.serves_vegetarian_food || null,
    place.serves_wine || null,
    place.takeout || null,
    place.wheelchair_accessible_entrance || null,
  ];
  const result = await base.query(query, params);
  return result;
};

const getPlace = async (id) => {
  const query = "SELECT * FROM places WHERE id = $1";
  const params = [id];
  const result = await base.query(query, params);
  return result;
};

const getPlaces = async () => {
  const query = "SELECT * FROM places";
  const result = await base.query(query);
  return result;
};

const updatePlace = async (id, place) => {
  const query =
    "UPDATE places SET name = $1, address = $2, lat = $3, lon = $4, type = $5 WHERE id = $6 RETURNING *";
  const params = [
    place.name,
    place.address,
    place.lat,
    place.lon,
    place.type,
    id,
  ];
  const result = await base.query(query, params);
  return result;
};

const deletePlace = async (id) => {
  const query = "DELETE FROM places WHERE id = $1";
  const params = [id];
  const result = await base.query(query, params);
  return result;
};

module.exports = {
  createPlace,
  getPlace,
  getPlaces,
  updatePlace,
  deletePlace,
};
