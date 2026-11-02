if (global.br_active)
{
    if (global.br_target(br_owner, -1) < 0)
    {
        if (br_extra) { instance_destroy(); exit; }
        // Preserve the engine's canonical instance even if its owner is down.
        for (var bs = 0; bs < 3; bs++) if (global.br_target(bs, -1) >= 0) { br_owner = bs; break; }
        var br_new_owner = br_owner;
        with (obj_heart) if (br_extra && br_owner == br_new_owner) instance_destroy();
    }
    br_save_held = global.input_held;
    br_save_pressed = global.input_pressed;
    br_save_released = global.input_released;
    br_save_inv = global.inv;
    br_save_x = global.heartx;
    br_save_y = global.hearty;
    global.br_set_input(br_owner);
    global.inv = br_inv;
}
