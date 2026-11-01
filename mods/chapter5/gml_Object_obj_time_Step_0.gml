// Start the native encounter after the room and party instances exist.
if (variable_global_exists("bossroom_stage") && global.bossroom_stage == 1 && instance_exists(obj_mainchara))
{
    global.bossroom_delay += 1;
    global.interact = 2;
    var br_ready = true;
    for (var br_t = 0; br_t < array_length(global.bossroom_pages); br_t++)
        if (!texture_is_ready(global.bossroom_pages[br_t])) br_ready = false;
    if (global.bossroom_delay >= 2 && br_ready)
    {
        global.bossroom_stage = 2;
        with (obj_battletester) instance_destroy();
        with (obj_chaseenemy) instance_destroy();
        global.kbdBlocked = false;
        global.encounterno = global.bossroom_encounter;
        global.specialbattle = global.bossroom_special;
        global.flag[9] = 1;
        global.flag[54] = global.encounterno;
        if (global.encounterno == 225)
            global.batmusic[0] = asset_get_index("snd_bossroom_flowery_music");
        else global.batmusic[0] = snd_init(global.bossroom_music);
        instance_create(0, 0, obj_battleback);
        instance_create(0, 0, obj_encounterbasic);
        show_debug_message("BOSSROOM: native encounter started " + string(global.encounterno));
    }
}

if (scr_debug())
{
}
if (global.is_console && sunkus_kb_check_pressed(vk_pause))
{
    paused = !paused;
    if (!sprite_exists(screenshot))
    {
        screenshot = sprite_create_from_surface(application_surface, 0, 0, view_wport, view_hport, 0, 0, 0, 0);
    }
}
if (global.is_console)
{
    if (!i_ex(obj_border_controller))
    {
        var border_controller = instance_create(0, 0, obj_border_controller);
        border_controller.init_border();
    }
}
