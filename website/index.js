function menu(x){
    switch(x){
        case "home":
            var div = `
            <div id = "menu">
            <h1>tee</h1>
            <h3>loli.support</h3>
            <p>developer | graphic designer | editor</p>
            <p>
                <a href="https://twitter.com/loli_tee" target="_blank">twitter </a> 
                <a href="https://github.com/lolitee" target="_blank">github </a>
                <a href="https://twitch.tv/loli_tee" target="_blank">twitch </a>
                <a href="https://emotes.loli.support" target="_blank">discord </a> 
                <a href="https://steamcommunity.com/id/tightens" target="_blank">steam </a>
                <a href="https://osu.ppy.sh/users/Tee" target="_blank">osu!</a>
            </p>
        </div>
        `
            $("#menu").replaceWith(div)
            break;
        case "about":
            $("#menu").replaceWith(`<div id = "menu">`)
            break;
        case "contacts":
            var div = 
            `
            <div id = "menu">

            <p>discord: Tee#0001</p>
            <p>twitter: @loli_tee</p>
            <p>osu!: Tee</p>
            <p>mail: admin@loli.support</p>

        </div>
            `
            $("#menu").replaceWith(div)
            break;
        case "projects":
            $("#menu").replaceWith(`<div id = "menu">`)
            break;
    }
}
