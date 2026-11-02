if (global.br_active)
{
    if (br_inv >= 0 || global.br_target(br_owner, -1) < 0) exit;
    var br_old_inv = global.inv;
    global.inv = br_inv;
    global.br_hit_owner = br_owner;
    global.br_hit_heart = id;
    with (other) event_user(5);
    br_inv = global.inv;
    global.inv = br_extra ? br_old_inv : br_inv;
    global.br_hit_owner = -1;
    global.br_hit_heart = noone;
}
else with (other) event_user(5);
