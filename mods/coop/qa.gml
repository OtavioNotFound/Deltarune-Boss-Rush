// Included only in local QA builds by BOSSROOM_COOP_QA=1.
if (global.br_active && variable_struct_exists(global.br_packet, "qa"))
{
    var cmd = global.br_packet.qa;
    if (!variable_global_exists("br_qa_seq")) global.br_qa_seq = -1;
    if (cmd.seq > global.br_qa_seq)
    {
        global.br_qa_seq = cmd.seq;
        if (cmd.verb == "arena")
        {
            global.br_qa_mode = true;
            global.turntimer = 10000;
            with (obj_heart) instance_destroy();
            global.br_spawn = -1;
            var soul = instance_create(240, 140, obj_heart);
            soul.br_owner = 0;
        }
        if (cmd.verb == "hit")
        {
            with (obj_heart)
            {
                if (br_owner == cmd.seat)
                {
                    br_inv = -1;
                    var bullet = instance_create(x, y, obj_regularbullet);
                    bullet.damage = 40;
                    bullet.target = cmd.target;
                    bullet.speed = 0;
                    bullet.sprite_index = sprite_index;
                    bullet.mask_index = mask_index;
                    bullet.image_xscale = image_xscale;
                    bullet.image_yscale = image_yscale;
                }
            }
        }
        if (cmd.verb == "down") global.hp[cmd.character] = 0;
        if (cmd.verb == "heal") for (var ch = 1; ch <= 3; ch++) global.hp[ch] = global.maxhp[ch];
        if (cmd.verb == "clear") { with (obj_heart) instance_destroy(); global.br_qa_mode = false; }
    }
}
