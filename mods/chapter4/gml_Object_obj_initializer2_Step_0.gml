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
        var br_groups = ["__yy__0spr_worley_noise_yyg_auto_gen_tex_group_name_0", "__yy__1image_depth_extend_mono_seamless_pow2_yyg_auto_gen_tex_group_name_0", "__yy__2spr_whirl_texture3_yyg_auto_gen_tex_group_name_0", "__yy__3spr_worley_noise_darker_yyg_auto_gen_tex_group_name_0", "__yy__4spr_perlin_noise_high_contrast_yyg_auto_gen_tex_group_name_0", "__yy__5spr_perlin_noise_240_yyg_auto_gen_tex_group_name_0", "__yy__6spr_perlin_noise_looping_yyg_auto_gen_tex_group_name_0", "__yy__7fallbacktexture.png_yyg_auto_gen_tex_group_name_", "autocrop", "consoleps4", "default", "noautocrop"];
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

if (!instance_exists(obj_time))
{
    scr_input_manager_process();
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
        show_debug_message_concat("TEXTURES LOADED");
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
    if (scr_chapter_save_file_exists(global.chapter) || ossafe_file_exists("dr.ini"))
    {
        menu_go = 1;
    }
    if (scr_completed_chapter_any_slot(global.chapter))
    {
        menu_go = 2;
    }
    if (scr_debug())
    {
        menu_go = 3;
    }
    if (menu_go == 0 || menu_go == 1)
    {
        if (global.is_console)
        {
            global.screen_border_alpha = 0;
        }
        roomchoice = room_intro_ch4;
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
        roomchoice = room_title_placeholder;
    }
    room_goto(roomchoice);
}
if (scr_debug())
{
    if (!instance_exists(obj_debugProfiler))
    {
        instance_create_depth(0, 0, 0, obj_debugProfiler);
    }
}
