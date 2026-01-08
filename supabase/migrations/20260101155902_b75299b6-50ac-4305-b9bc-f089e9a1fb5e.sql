
-- Delete all data from tables (order matters due to foreign keys)
DELETE FROM notifications;
DELETE FROM likes;
DELETE FROM comments;
DELETE FROM private_messages;
DELETE FROM private_conversations;
DELETE FROM chat_messages;
DELETE FROM posts;

-- Delete from other tables that might have user references
DELETE FROM baby_deliveries;
DELETE FROM characters;
DELETE FROM contraceptive_effects;
DELETE FROM establishment_workers;
DELETE FROM food_orders;
DELETE FROM fridge_items;
DELETE FROM house_invites;
DELETE FROM houses;
DELETE FROM inventory;
DELETE FROM job_applications;
DELETE FROM jyp_appearances;
DELETE FROM pharmacy_orders;
DELETE FROM pregnancies;
DELETE FROM pregnancy_tests;
DELETE FROM room_authorizations;
DELETE FROM scratch_cards;
DELETE FROM supermarket_purchases;
DELETE FROM treatment_requests;
DELETE FROM vip_reservation_guests;
DELETE FROM vip_reservations;

-- Finally delete profiles (this won't delete auth.users)
DELETE FROM profiles;
