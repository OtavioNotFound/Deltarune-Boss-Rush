// Boss Room: use the prepared save to initialize stats, then bypass campaign menus.
if (audio_group_is_loaded(audio_sfx) && ossafe_file_exists("bossroom.ini"))
{
    ini_open("bossroom.ini");
    global.bossroom_encounter = ini_read_real("battle", "encounter", -1);
    global.bossroom_special = ini_read_real("battle", "special", 1);
    global.bossroom_music = ini_read_string("battle", "music", "battle.ogg");
    ini_close();
    if (global.bossroom_encounter >= 0)
    {
        global.filechoice = 0;
        // Saves from public collections may contain boosted stats. Keep native chapter defaults.
        var br_stats = [];
        var br_count = min(array_length(global.hp), array_length(global.maxhp), array_length(global.at), array_length(global.df), array_length(global.mag), array_length(global.guts));
        for (var br_i = 0; br_i < br_count; br_i++)
            br_stats[br_i] = [global.maxhp[br_i], global.at[br_i], global.df[br_i], global.mag[br_i], global.guts[br_i]];
        scr_load();
        br_count = min(br_count, min(array_length(global.hp), array_length(global.maxhp), array_length(global.at), array_length(global.df), array_length(global.mag), array_length(global.guts)));
        for (var br_i = 0; br_i < br_count; br_i++)
        {
            global.maxhp[br_i] = br_stats[br_i][0]; global.hp[br_i] = br_stats[br_i][0];
            global.at[br_i] = br_stats[br_i][1]; global.df[br_i] = br_stats[br_i][2];
            global.mag[br_i] = br_stats[br_i][3]; global.guts[br_i] = br_stats[br_i][4];
        }
        global.inv = 0; global.invc = 1; global.debug = 0;
        global.bossroom_pages = [];
        var br_groups = ["__yy__0fallbacktexture.png_yyg_auto_gen_tex_group_name_", "consoleps4", "default"];
        for (var br_g = 0; br_g < array_length(br_groups); br_g++)
        {
            var br_pages = texturegroup_get_textures(br_groups[br_g]);
            for (var br_t = 0; br_t < array_length(br_pages); br_t++)
            {
                global.bossroom_pages[array_length(global.bossroom_pages)] = br_pages[br_t];
                texture_prefetch(br_pages[br_t]);
            }
        }
        global.bossroom_stage = 1;
        global.bossroom_delay = 0;
        var arena = asset_get_index("room_battletest");
        if (arena >= 0) room_goto(arena);
        exit;
    }
}

if (global.is_console)
{
    if (global.savedata_async_id >= 0)
    {
        exit;
    }
    if (!variable_global_exists("chapter"))
    {
        exit;
    }
    if (!textures_loaded)
    {
        textures_loaded = loadtex.loaded;
    }
    if (textures_loaded)
    {
    }
    else
    {
        exit;
    }
}
var CH = string(global.chapter);
if (audio_group_is_loaded(audio_sfx))
{
    roomchoice = PLACE_CONTACT;
    menu_go = 0;
    if (ossafe_file_exists("filech" + CH + "_0"))
    {
        menu_go = 1;
    }
    if (ossafe_file_exists("filech" + CH + "_1"))
    {
        menu_go = 1;
    }
    if (ossafe_file_exists("filech" + CH + "_2"))
    {
        menu_go = 1;
    }
    if (ossafe_file_exists("filech" + CH + "_3"))
    {
        menu_go = 1;
    }
    if (ossafe_file_exists("dr.ini"))
    {
        menu_go = 1;
    }
    if (ossafe_file_exists("filech" + CH + "_3"))
    {
        menu_go = 2;
    }
    if (ossafe_file_exists("filech" + CH + "_4"))
    {
        menu_go = 2;
    }
    if (ossafe_file_exists("filech" + CH + "_5"))
    {
        menu_go = 2;
    }
    if (global.is_console)
    {
        if (global.game_won == 1)
        {
            menu_go = 2;
        }
    }
    if (menu_go == 0 || menu_go == 1)
    {
        if (global.is_console)
        {
            global.screen_border_alpha = 0;
        }
        roomchoice = room_intro_ch2;
    }
    if (menu_go == 2)
    {
        if (global.is_console)
        {
            global.screen_border_alpha = 1;
        }
        scr_windowcaption("DELTARUNE");
        global.tempflag[10] = 1;
        roomchoice = room_legend;
        global.plot = 0;
    }
    if (menu_go == 3)
    {
        if (global.is_console)
        {
            global.screen_border_alpha = 0;
        }
        roomchoice = room_next(room);
    }
    room_goto(roomchoice);
}
if (scr_debug())
{
}
