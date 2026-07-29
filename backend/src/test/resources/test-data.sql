DELETE FROM system_settings;
INSERT INTO system_settings (id, welcome_coins_enabled, welcome_coins_amount, referral_coins_enabled, referral_coins_l1_amount, referral_coins_l2_amount, referral_coins_l3_amount, referral_coins_subsequent_enabled, referral_coins_subsequent_amount, referral_coins_limit_tier, email_verification_enabled, phone_verification_enabled, first_deposit_reward_enabled, first_deposit_reward_amount, first_deposit_reward_threshold, points_to_cash_conversion_rate, points_conversion_enabled, smtp_host, smtp_port, smtp_username, smtp_password, smtp_from_email, smtp_from_name, email_notifications_enabled, app_timezone, app_currency) 
VALUES (1, true, 1000, true, 500, 200, 100, true, 50, 3, false, false, true, 100.0000, 500.0000, 10.0000, true, 'smtp.gmail.com', 587, '', '', 'noreply@tradex.com', 'TradeX', false, 'Asia/Kolkata', 'INR');
DELETE FROM user_permissions;
DELETE FROM user_teams;
DELETE FROM ticket_history;
DELETE FROM ticket_comments;
DELETE FROM ticket_attachments;
DELETE FROM support_tickets;
DELETE FROM points_transactions;
DELETE FROM wallet_transactions;
DELETE FROM referral_rewards;
DELETE FROM verification_tokens;
DELETE FROM admin_audit_log;
DELETE FROM bank_details;
DELETE FROM users;

INSERT INTO users (id, email, password, points_balance, referral_code, referral_path, referred_by_id, role, email_verified, phone_verified, phone_number, created_at, withdrawable_balance, bonus_balance, enabled, locked, expired, credentials_expired) 
VALUES (100, 'root@example.com', 'pass', 0, 'ROOTREF', '.100.', null, 'USER', true, true, '+1234567890', CURRENT_TIMESTAMP, 0.00, 0.00, true, false, false, false);

INSERT INTO users (id, email, password, points_balance, referral_code, referral_path, referred_by_id, role, email_verified, phone_verified, phone_number, created_at, withdrawable_balance, bonus_balance, enabled, locked, expired, credentials_expired) 
VALUES (101, 'l1@example.com', 'pass', 0, 'L1REF', '.100.101.', 100, 'USER', true, true, '+1234567891', CURRENT_TIMESTAMP, 0.00, 0.00, true, false, false, false);

INSERT INTO users (id, email, password, points_balance, referral_code, referral_path, referred_by_id, role, email_verified, phone_verified, phone_number, created_at, withdrawable_balance, bonus_balance, enabled, locked, expired, credentials_expired) 
VALUES (102, 'l2@example.com', 'pass', 0, 'L2REF', '.100.101.102.', 101, 'USER', true, true, '+1234567892', CURRENT_TIMESTAMP, 0.00, 0.00, true, false, false, false);

INSERT INTO users (id, email, password, points_balance, referral_code, referral_path, referred_by_id, role, email_verified, phone_verified, phone_number, created_at, withdrawable_balance, bonus_balance, enabled, locked, expired, credentials_expired) 
VALUES (103, 'l3@example.com', 'pass', 0, 'L3REF', '.100.101.102.103.', 102, 'USER', true, true, '+1234567893', CURRENT_TIMESTAMP, 0.00, 0.00, true, false, false, false);

INSERT INTO bank_details (id, user_id, account_number, ifsc_code, holder_name, bank_name, is_primary) VALUES (100, 100, 'ACC100', 'IFSC100', 'Root User', 'Test Bank', true);
INSERT INTO bank_details (id, user_id, account_number, ifsc_code, holder_name, bank_name, is_primary) VALUES (101, 101, 'ACC101', 'IFSC101', 'L1 User', 'Test Bank', true);
INSERT INTO bank_details (id, user_id, account_number, ifsc_code, holder_name, bank_name, is_primary) VALUES (102, 102, 'ACC102', 'IFSC102', 'L2 User', 'Test Bank', true);
INSERT INTO bank_details (id, user_id, account_number, ifsc_code, holder_name, bank_name, is_primary) VALUES (103, 103, 'ACC103', 'IFSC103', 'L3 User', 'Test Bank', true);
