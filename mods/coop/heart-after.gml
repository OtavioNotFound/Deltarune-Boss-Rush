if (global.br_active)
{
    br_inv = global.inv;
    global.input_held = br_save_held;
    global.input_pressed = br_save_pressed;
    global.input_released = br_save_released;
    if (br_extra)
    {
        global.inv = br_save_inv;
        global.heartx = br_save_x;
        global.hearty = br_save_y;
    }
    var br_colors = [c_red, c_fuchsia, c_aqua];
    image_blend = br_colors[br_owner];
    if (!br_extra)
    {
        for (var bs = 0; bs < 3; bs++)
        {
            if (bs == br_owner || global.br_target(bs, -1) < 0) continue;
            var found = false;
            with (obj_heart) if (br_owner == bs) found = true;
            if (!found)
            {
                global.br_spawn = bs;
                var soul = instance_create(x, y, obj_heart);
                // Initially overlap so every heart starts inside the actual board.
                soul.boundaryup = boundaryup;
                soul.sprite_index = sprite_index;
                soul.mask_index = mask_index;
                soul.image_xscale = image_xscale;
                soul.image_yscale = image_yscale;
                if (variable_instance_exists(id, "color")) soul.color = color;
                global.br_spawn = -1;
            }
        }
    }
}
else image_blend = c_white;
