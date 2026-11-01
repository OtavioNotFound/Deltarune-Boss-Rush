if (i_ex(obj_ch5_DW29) && i_ex(obj_ch5_DW29.fl_actor))
{
    with (obj_ch5_DW29.fl_actor)
    {
        visible = false;
    }
}
sprite_set_offset(spr_orange_animepunch_finished_cent, 0, 0);
sprite_set_offset(spr_kris_t_pose, 5, -2);
sprite_set_offset(spr_susie_t_pose2, 3, -2);
sprite_set_offset(spr_ralsei_tpose, -2, -6);
sprite_set_offset(spr_kris_y_pose, 5, -2);
sprite_set_offset(spr_susie_m_pose, 3, 0);
sprite_set_offset(spr_ralsei_c_pose, -2, -5);
snd_stop(global.batmusic[1]);
if (variable_global_exists("bossroom_stage"))
    global.batmusic[0] = asset_get_index("snd_bossroom_flowery_music");
else global.batmusic[0] = snd_init("Flowerman_Arrangement.ogg");
global.batmusic[1] = mus_loop_ext(global.batmusic[0], 1, 1);
succeed_trial_count = 0;
chase_attack_difficulty = 0;
draw_test = true;
orange_jump_con = 0;
orange_jump_timer = 0;
aqua_phase_balloon_order = 1;
orange_phase_balloon_order = 1;
moar_tension = 1;
introcon = 1;
global.tempflag[65]++;
global.flag[1865] = global.tempflag[65];
if (global.flag[1865] > 1)
{
    introcon = 3;
}
global.tempflag[74]++;
hold_it_objection = false;
global.flag[1894] = global.tempflag[70];
global.flag[1874] = global.tempflag[73];
NOOO_MERCY = true;
phases3turn = 0;
phases4turn = 0;
phases5turn = 0;
phases6turn = 0;
aqua_and_purple_enter = 0;
green_and_orange_enter = 0;
yellow_and_blue_enter = 0;
yellow_and_blue_enter_timer = 0;
cannot_fight_text_used = false;
scr_enemy_object_init();
recruitcount = 1;
talkmax = 90;
idlesprite = spr_flowery_idle3;
hurtsprite = spr_flowery_hurt;
sparedsprite = spr_flowery_idle3;
pattern_category = 0;
pattern_test = 3;
_category = "Jarona";
category_size = 0;
pattern_test = 3;
target = 4;
damage = 99;
phase = 1;
act_type = 0;
flowerbuttonactive = false;
tpdraintimer = 0;
tpsave = 0;
init = false;
endcon = 0;
endtimer = 0;
phaseturn = 0;
phasetransition_con = 0;
phasetransition_timer = 0;
blowawaybattlemsg = false;
partydefensedropbattlemsg = false;
partytiredbattlemsg = false;
actshavechangedbattlemsg = false;
healingscenecon = 0;
healingscenetimer = 0;
ballooncon = 0;
balloonend = 0;
susietalks = 0;
ralseitalks = 0;
correctact = 1;
failedpreviousact = false;
partyistired = false;
partydefenselowered = false;
caster = 2;
debugtimer = 0;
defensedowntimer = 0;
rand_array[0] = 1;
rand_array[1] = 2;
rand_array[2] = 3;
rand_array[3] = 4;
introtimer = 0;
with (obj_battleback)
{
    instance_destroy();
}
mercyaddcon = 0;
mercyaddtimer = 0;
sprite_index = idlesprite;
image_speed = 0.16666666666666666;
aqua_mercy = 0;
purple_mercy = 0;
orange_mercy = 0;
green_mercy = 0;
blue_mercy = 0;
yellow_mercy = 0;
create_afterimage = false;
create_afterimage_timer = 0;
pose_alone = false;
progress = 0;
starttimer = 0;
blown = 0;
blowaway = true;
blowanimtimer = 0;
onoff = 0;
shakeamt = 0;
presstimer = 0;
acttimer = 0;
acttimermax = 210;
presscount_1 = 0;
animsiner = 0;
xoff = 0;
ralsei_tutorial_string_con = 0;
ralsei_tutorial_string = stringsetloc("\\EE* (Kris! Press and release&~1 to dash!&Tapping it works, too!)", "obj_flowery_enemy_slash_Create_0_gml_127_0");
flowery_blowkiss_scene_con = 0;
flowery_blowkiss_scene_timer = 0;
floradinn_recruited = false;
if (global.flag[670] == 1)
{
    floradinn_recruited = true;
}
leafling_recruited = false;
if (global.flag[671] == 1)
{
    leafling_recruited = true;
}
shi_recruited = false;
if (global.flag[672] == 1)
{
    shi_recruited = true;
}
shinobeetle_recruited = false;
if (global.flag[673] == 1)
{
    shinobeetle_recruited = true;
}
kawkaw_recruited = false;
if (global.flag[674] == 1)
{
    kawkaw_recruited = true;
}
sethaqua_defeated_with_violence = false;
defeatedpink = false;
float_siner = 0;
remove_ralsei_con = 0;
remove_ralsei_timer = 0;
overwrite_correct = 0;
force_hurt_sprite = false;
ralsei_removed = false;
did_sethaqua_attack_hit_count = 0;
did_sethaqua_attack_without_getting_hurt = false;
open_chase_counter = 0;
orange_adjust_con = 0;
if (scr_debug())
{
}
if (i_ex(obj_flowery_towery))
{
    towery = 919;
}
else
{
    towery = instance_create_depth(camerax() + 320, cameray(), depth + 1000, obj_flowery_towery);
}
floradin_marker = instance_create_depth(camerax() - 200, cameray() + 80, depth + 100, obj_flowery_marker);
floradin_marker.sprite_index = spr_floradinn_blowwind;
floradin_marker.image_xscale = 2;
floradin_marker.image_yscale = 2;
floradin_marker.image_speed = 0;
leafling_marker = instance_create_depth(camerax() - 200, cameray() + 160, depth + 100, obj_flowery_marker);
leafling_marker.sprite_index = spr_leafling_blowwind;
leafling_marker.image_xscale = 2;
leafling_marker.image_yscale = 2;
leafling_marker.image_speed = 0;
kawkaw_marker = instance_create_depth(camerax() - 200, cameray() + 240, depth + 100, obj_flowery_marker);
kawkaw_marker.sprite_index = spr_kawkaw_blow_wind;
kawkaw_marker.image_xscale = 2;
kawkaw_marker.image_yscale = 2;
kawkaw_marker.image_speed = 0;
shi_marker = instance_create_depth(camerax() - 200, cameray() + 40, depth + 102, obj_flowery_marker);
shi_marker.sprite_index = spr_scarecrow;
shi_marker.image_xscale = -2;
shi_marker.image_yscale = 2;
shi_marker.image_speed = 0;
shinobeetle_marker = instance_create_depth(camerax() - 200, cameray() + 120, depth + 101, obj_flowery_marker);
shinobeetle_marker.sprite_index = spr_shinobeetle;
shinobeetle_marker.image_xscale = -2;
shinobeetle_marker.image_yscale = 2;
shinobeetle_marker.image_speed = 0;
purple_marker = instance_create_depth(camerax() + camerawidth() + 200, cameray() + 72, depth + 100, obj_flowery_marker);
purple_marker.sprite_index = spr_seth_idle_serious_flowery;
purple_marker.image_xscale = 2;
purple_marker.image_yscale = 2;
purple_marker.image_speed = 0.16666666666666666;
purple_marker.image_alpha = 1;
purple_timer = 0;
aqua_marker = instance_create_depth(camerax() + camerawidth() + 200, cameray() + 228, depth + 100, obj_flowery_marker);
aqua_marker.sprite_index = spr_enemy_aqua_spin;
aqua_marker.image_xscale = 2;
aqua_marker.image_yscale = 2;
aqua_marker.image_speed = 1/3;
aqua_marker.image_alpha = 1;
orange_marker = instance_create_depth(camerax() + camerawidth() + 200, (cameray() + 90) - 40, depth + 100, obj_flowery_marker);
orange_marker.sprite_index = spr_enemy_orange_flowery_angry;
orange_marker.image_xscale = 2;
orange_marker.image_yscale = 2;
orange_marker.image_speed = 0;
orange_marker.image_index = 1;
orange_marker.image_alpha = 1;
green_marker = instance_create_depth(camerax() + camerawidth() + 200, cameray() + 214, depth + 100, obj_flowery_marker);
green_marker.sprite_index = spr_green_together;
green_marker.image_xscale = 2;
green_marker.image_yscale = 2;
green_marker.image_speed = 0.16666666666666666;
green_marker.image_alpha = 1;
blue_marker = instance_create_depth(camerax() + camerawidth() + 200, cameray() + 40, depth + 100, obj_flowery_marker);
blue_marker.sprite_index = spr_enemy_blue_ballet;
blue_marker.image_xscale = 2;
blue_marker.image_yscale = 2;
blue_marker.image_speed = 0.16666666666666666;
blue_marker.image_alpha = 1;
yellow_marker = instance_create_depth(camerax() + 532 + 72, (cameray() + 160) - 600, depth - 60, obj_flowery_marker);
yellow_marker.sprite_index = spr_yellow_cool_fall_armsraised;
yellow_marker.image_xscale = -2;
yellow_marker.image_yscale = 2;
yellow_marker.image_speed = 0.16666666666666666;
yellow_marker.image_alpha = 1;
spread_range = 500;
phase_1_2_turn = 0;
lyrics_alpha_con = 0;
lyrics_alpha_timer = 0;
damage_taken_during_tutorial = 0;
make_orange_visible_con = 0;
orange_fixibility_fix = 0;

drop_petal = function(arg0, arg1, arg2 = false, arg3 = -8, arg4 = 0.4, arg5 = false)
{
    var _scale = 2;
    var _petal = instance_create_depth(arg0, arg1, depth - 100 - (_scale * 10), obj_marker_doomed, 
    {
        image_xscale: _scale,
        image_yscale: _scale,
        sprite_index: spr_spin_petal,
        image_speed: random(0.2) + 0.1,
        gravity_direction: 125 + irandom(110),
        vspeed: 0,
        hspeed: -5,
        gravity: 0.75,
        image_alpha: 0,
        image_blend: merge_color(c_white, c_black, random(0.25))
    });
    _petal.alarm[0] = 120;
    with (_petal)
    {
        scr_lerpvar("image_alpha", 0, 1, 6, 2, "in");
    }
};

drop_petal2 = function(arg0, arg1, arg2 = false, arg3 = -4, arg4 = 0.2, arg5 = false)
{
    var _scale = 2;
    var _petal = instance_create_depth(arg0, arg1, depth - 100 - (_scale * 10), obj_marker_doomed, 
    {
        image_xscale: _scale,
        image_yscale: _scale,
        sprite_index: spr_spin_petal,
        image_speed: random(0.2) + 0.1,
        gravity_direction: 155 + random(10),
        vspeed: 6,
        hspeed: -3,
        gravity: 0.15,
        image_blend: merge_color(c_white, c_black, random(0.25))
    });
    _petal.alarm[0] = 120;
};

flowery_balloon = function(arg0 = x - 8, arg1 = y + 40)
{
    if (i_ex(obj_balloon_queue))
    {
        msgset_fromqueue();
    }
};

flowery_balloon_control = function()
{
    if ((button3_p() && talktimer > 15) || !instance_exists(obj_writer))
    {
        with (obj_writer)
        {
            instance_destroy();
        }
        if (i_ex(obj_balloon_queue))
        {
            msgset_fromqueue();
        }
    }
};

myattackchoice = 0;

make_petal_storm = function(arg0, arg1, arg2, arg3, arg4 = -4)
{
    var _i = 0;
    repeat (arg3)
    {
        _i++;
        with (instance_create_depth(arg0, arg1, arg2, obj_orbitparticle))
        {
            xstart += random_range(-12, 12);
            ystart += random_range(-18, 18);
            sprite_index = choose(spr_bush_leaf_gold, spr_bush_leaf2_gold, spr_bush_leaf3_gold);
            scr_darksize();
            orbit_depth = depth;
            orbit_target = -4;
            y_target = ystart;
            orbit_dist = 0;
            orbit_target_follow = false;
            orbit_dist_target = 30;
            orbit_speed = 9;
            image_alpha = 0.7;
            event_perform(ev_step, ev_step_normal);
            with (instance_create_depth(x, y, depth - 10, obj_sparkle_fake_particle))
            {
                image_xscale = 2;
                image_yscale = 2;
                image_speed = 0.25;
                speed = 3;
                friction = 0.1;
                direction = random(360);
                image_blend = merge_color(c_yellow, c_white, random(0.7));
            }
        }
    }
};
