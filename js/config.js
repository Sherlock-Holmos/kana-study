    /* ========================================
       五十音数据
       ======================================== */

    const kanaData = [

      // あ行
      {
        kana: "あ",
        roman: "a",
        group: "a",
        memory: "安 → あ → a"
      },

      {
        kana: "い",
        roman: "i",
        group: "a",
        memory: "以 → い → i"
      },

      {
        kana: "う",
        roman: "u",
        group: "a",
        memory: "宇 → う → u"
      },

      {
        kana: "え",
        roman: "e",
        group: "a",
        memory: "衣 → え → e"
      },

      {
        kana: "お",
        roman: "o",
        group: "a",
        memory: "於 → お → o；右上还有一点"
      },


      // か行
      {
        kana: "か",
        roman: "ka",
        group: "ka",
        memory: "加 → か → ka"
      },

      {
        kana: "き",
        roman: "ki",
        group: "ka",
        memory: "幾 → き → ki；横线比较多"
      },

      {
        kana: "く",
        roman: "ku",
        group: "ka",
        memory: "久 → く → ku；也可以联想「哭 ku」"
      },

      {
        kana: "け",
        roman: "ke",
        group: "ka",
        memory: "計 → け → ke；联想「刻 ke 下记号」"
      },

      {
        kana: "こ",
        roman: "ko",
        group: "ka",
        memory: "己 → こ → ko；两条横线"
      },


      // さ行
      {
        kana: "さ",
        roman: "sa",
        group: "sa",
        memory: "左 → さ → sa；也可联想「伞 sa」"
      },

      {
        kana: "し",
        roman: "shi",
        group: "sa",
        memory: "之 → し → shi"
      },

      {
        kana: "す",
        roman: "su",
        group: "sa",
        memory: "寸 → す → su；像丝线绕了一圈"
      },

      {
        kana: "せ",
        roman: "se",
        group: "sa",
        memory: "世 → せ → se"
      },

      {
        kana: "そ",
        roman: "so",
        group: "sa",
        memory: "曽 → そ → so；字形可以联想 S"
      },


      // た行
      {
        kana: "た",
        roman: "ta",
        group: "ta",
        memory: "太 → た → ta"
      },

      {
        kana: "ち",
        roman: "chi",
        group: "ta",
        memory: "知 → ち → chi；注意不是 ti"
      },

      {
        kana: "つ",
        roman: "tsu",
        group: "ta",
        memory: "川 → つ → tsu；像一个大弯钩"
      },

      {
        kana: "て",
        roman: "te",
        group: "ta",
        memory: "天 → て → te"
      },

      {
        kana: "と",
        roman: "to",
        group: "ta",
        memory: "止 → と → to"
      },


      // な行
      {
        kana: "な",
        roman: "na",
        group: "na",
        memory: "奈 → な → na"
      },

      {
        kana: "に",
        roman: "ni",
        group: "na",
        memory: "仁 → に → ni；两条横线很明显"
      },

      {
        kana: "ぬ",
        roman: "nu",
        group: "na",
        memory: "奴 → ぬ → nu；有圈并拖着尾巴"
      },

      {
        kana: "ね",
        roman: "ne",
        group: "na",
        memory: "祢 → ね → ne；右侧绕一个圈"
      },

      {
        kana: "の",
        roman: "no",
        group: "na",
        memory: "乃 → の → no；像一笔画出的圆圈"
      },


      // は行
      {
        kana: "は",
        roman: "ha",
        group: "ha",
        memory: "波 → は → ha；注意和 ほ 区分"
      },

      {
        kana: "ひ",
        roman: "hi",
        group: "ha",
        memory: "比 → ひ → hi"
      },

      {
        kana: "ふ",
        roman: "fu",
        group: "ha",
        memory: "不 → ふ → fu；像呼出一口气"
      },

      {
        kana: "へ",
        roman: "he",
        group: "ha",
        memory: "部 → へ → he；字形像 ^"
      },

      {
        kana: "ほ",
        roman: "ho",
        group: "ha",
        memory: "保 → ほ → ho；比 は 多一横"
      },


      // ま行
      {
        kana: "ま",
        roman: "ma",
        group: "ma",
        memory: "末 → ま → ma"
      },

      {
        kana: "み",
        roman: "mi",
        group: "ma",
        memory: "美 → み → mi"
      },

      {
        kana: "む",
        roman: "mu",
        group: "ma",
        memory: "武 → む → mu；下面卷起来"
      },

      {
        kana: "め",
        roman: "me",
        group: "ma",
        memory: "女 → め → me；注意和 ぬ 区分"
      },

      {
        kana: "も",
        roman: "mo",
        group: "ma",
        memory: "毛 → も → mo"
      },


      // や行
      {
        kana: "や",
        roman: "ya",
        group: "ya",
        memory: "也 → や → ya"
      },

      {
        kana: "ゆ",
        roman: "yu",
        group: "ya",
        memory: "由 → ゆ → yu"
      },

      {
        kana: "よ",
        roman: "yo",
        group: "ya",
        memory: "与 → よ → yo"
      },


      // ら行
      {
        kana: "ら",
        roman: "ra",
        group: "ra",
        memory: "良 → ら → ra"
      },

      {
        kana: "り",
        roman: "ri",
        group: "ra",
        memory: "利 → り → ri；通常写成两笔"
      },

      {
        kana: "る",
        roman: "ru",
        group: "ra",
        memory: "留 → る → ru；下面有小圈和尾巴"
      },

      {
        kana: "れ",
        roman: "re",
        group: "ra",
        memory: "礼 → れ → re；右边直接甩出去"
      },

      {
        kana: "ろ",
        roman: "ro",
        group: "ra",
        memory: "呂 → ろ → ro；比 る 更简单"
      },


      // わ行
      {
        kana: "わ",
        roman: "wa",
        group: "wa",
        memory: "和 → わ → wa"
      },

      {
        kana: "を",
        roman: "o",
        group: "wa",
        memory: "遠 → を；现代日语通常读 o，也常写作 wo"
      },

      {
        kana: "ん",
        roman: "n",
        group: "wa",
        memory: "ん → n；鼻音，类似「嗯」的尾音"
      }

    ];


