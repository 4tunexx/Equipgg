-- Helper function to check if user has enough coins for a purchase
CREATE OR REPLACE FUNCTION check_user_coins(
    p_user_id UUID,
    p_amount INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id AND coins >= p_amount
    );
END;
$$ LANGUAGE plpgsql;

-- Function to purchase a shop item
CREATE OR REPLACE FUNCTION purchase_shop_item(
    p_user_id UUID,
    p_shop_item_id UUID
) RETURNS void AS $$
DECLARE
    v_item_price INTEGER;
    v_item_id UUID;
BEGIN
    -- Get item price and ID
    SELECT price, item_id INTO v_item_price, v_item_id
    FROM shop_items
    WHERE id = p_shop_item_id AND (stock > 0 OR stock = -1)
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item not available';
    END IF;

    -- Check if user has enough coins
    IF NOT check_user_coins(p_user_id, v_item_price) THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;

    -- Deduct coins from user
    UPDATE users 
    SET coins = coins - v_item_price
    WHERE id = p_user_id;

    -- Add item to inventory
    INSERT INTO inventory_items (user_id, item_id)
    VALUES (p_user_id, v_item_id);

    -- Update stock if not unlimited
    IF v_stock != -1 THEN
        UPDATE shop_items 
        SET stock = stock - 1
        WHERE id = p_shop_item_id;
    END IF;

    -- Add to activity feed
    INSERT INTO activity_feed (user_id, action, item_id)
    VALUES (p_user_id, 'purchased', v_item_id);
END;
$$ LANGUAGE plpgsql;

-- Function to open a crate
CREATE OR REPLACE FUNCTION open_crate(
    p_user_id UUID,
    p_crate_id UUID
) RETURNS UUID AS $$
DECLARE
    v_crate_price INTEGER;
    v_random_roll DECIMAL;
    v_item_id UUID;
BEGIN
    -- Get crate price
    SELECT price INTO v_crate_price
    FROM crates
    WHERE id = p_crate_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Crate not found';
    END IF;

    -- Check if user has enough coins
    IF NOT check_user_coins(p_user_id, v_crate_price) THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;

    -- Deduct coins from user
    UPDATE users 
    SET coins = coins - v_crate_price
    WHERE id = p_user_id;

    -- Generate random number between 0 and 1
    v_random_roll := random();

    -- Select an item based on drop chances
    SELECT item_id INTO v_item_id
    FROM (
        SELECT 
            item_id,
            SUM(drop_chance) OVER (ORDER BY drop_chance) as cumulative_chance
        FROM crate_items
        WHERE crate_id = p_crate_id
    ) sub
    WHERE cumulative_chance >= v_random_roll
    ORDER BY cumulative_chance
    LIMIT 1;

    -- Add item to inventory
    INSERT INTO inventory_items (user_id, item_id)
    VALUES (p_user_id, v_item_id);

    -- Add to activity feed
    INSERT INTO activity_feed (user_id, action, item_id)
    VALUES (p_user_id, 'opened', v_item_id);

    RETURN v_item_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a mission
CREATE OR REPLACE FUNCTION complete_mission(
    p_user_id UUID,
    p_mission_id UUID
) RETURNS void AS $$
DECLARE
    v_xp_reward INTEGER;
    v_coin_reward INTEGER;
BEGIN
    -- Get mission rewards
    SELECT xp_reward, coin_reward INTO v_xp_reward, v_coin_reward
    FROM missions
    WHERE id = p_mission_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mission not found';
    END IF;

    -- Mark mission as completed
    UPDATE user_missions
    SET completed = true
    WHERE user_id = p_user_id AND mission_id = p_mission_id
    AND NOT completed
    AND (expires_at IS NULL OR expires_at > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mission not available or already completed';
    END IF;

    -- Award rewards
    UPDATE users 
    SET xp = xp + v_xp_reward,
        coins = coins + v_coin_reward,
        level = GREATEST(1, FLOOR(POWER(xp / 1000.0, 0.5))::INTEGER)
    WHERE id = p_user_id;

    -- Add to activity feed
    INSERT INTO activity_feed (user_id, action, xp)
    VALUES (p_user_id, 'completed mission', v_xp_reward);
END;
$$ LANGUAGE plpgsql;