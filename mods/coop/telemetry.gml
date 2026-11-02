var br_hearts = [];
with (obj_heart)
{
    if (variable_instance_exists(id, "br_owner"))
        array_push(br_hearts, {seat: br_owner, x: x, y: y, inv: br_inv});
}
clipboard_set_text("BRPARTY:" + json_stringify({v: 2, ready: 1, active: global.br_active,
    qa: variable_global_exists("br_qa_seq") ? global.br_qa_seq : -1,
    turn: variable_global_exists("charturn") ? global.charturn : -1,
    menu: variable_global_exists("bmenucoord") && variable_global_exists("charturn") && global.charturn >= 0 && global.charturn < 3 ? global.bmenucoord[0][global.charturn] : -1,
    myfight: variable_global_exists("myfight") ? global.myfight : -1, chars: global.char,
    hp: [global.hp[1], global.hp[2], global.hp[3]], hearts: br_hearts}));
