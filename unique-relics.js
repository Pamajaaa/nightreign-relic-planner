// 指定の神攻略wiki・固有遺物表を参照。暗き夜も通常遺物。
const UNIQUE_RELICS=[
  {
    "effects": [
      "武器の持ち替え時、物理攻撃力上昇",
      "投擲ナイフの攻撃力上昇",
      "生命力+1"
    ],
    "group": "固有遺物",
    "name": "忌み鬼の呪物",
    "image": "assets/relics/relic-00.png",
    "imageSource": "https://img.gamewith.jp/img/e2f6020d10f25c3c93562293073a7d9d.png"
  },
  {
    "effects": [
      "攻撃連続時、FP回復",
      "技量+3"
    ],
    "group": "固有遺物",
    "name": "古びた懐中時計",
    "image": "assets/relics/relic-01.png",
    "imageSource": "https://img.gamewith.jp/img/246dfc024e2ca7b8925242a66492c8ed.png"
  },
  {
    "effects": [
      "攻撃を受けると攻撃力上昇",
      "信仰+3"
    ],
    "group": "固有遺物",
    "name": "薄汚れたフレーム",
    "image": "assets/relics/relic-02.png",
    "imageSource": "https://img.gamewith.jp/img/ae066c01cf5ca1210678dceb49e3ed3a.png"
  },
  {
    "effects": [
      "【追跡者】スキル使用時、通常攻撃で炎を纏った追撃を行う（大剣のみ）",
      "物理攻撃力上昇"
    ],
    "group": "記憶の断片",
    "name": "にび色の砥石",
    "image": "assets/relics/relic-03.png",
    "imageSource": "https://img.gamewith.jp/img/83d83f29560885f915566d9cc80841d5.png"
  },
  {
    "effects": [
      "【追跡者】アビリティ発動時、アーツゲージ増加",
      "アーツゲージ自然蓄積+3",
      "神秘+3"
    ],
    "group": "記憶の断片",
    "name": "銀の雫",
    "image": "assets/relics/relic-04.png",
    "imageSource": "https://img.gamewith.jp/img/a1c216ce4039f410a5105919a3f29954.png"
  },
  {
    "effects": [
      "【追跡者】アーツ発動時、周囲を延焼",
      "【追跡者】スキルの使用回数+1",
      "攻撃命中時、スタミナ回復"
    ],
    "group": "記憶の断片",
    "name": "追跡者の耳飾り",
    "image": "assets/relics/relic-05.png",
    "imageSource": "https://img.gamewith.jp/img/cbb2da7bdc1de38204c2f9b73dd87d54.png"
  },
  {
    "effects": [
      "【守護者】スキルの持続時間延長",
      "スキルクールタイム軽減+3"
    ],
    "group": "記憶の断片",
    "name": "石の杭",
    "image": "assets/relics/relic-06.png",
    "imageSource": "https://img.gamewith.jp/img/cfd33868a0bc374bb5c5970bfd54ee42.png"
  },
  {
    "effects": [
      "【守護者】斧槍タメ攻撃時、つむじ風が発生",
      "斧槍の攻撃でHP回復"
    ],
    "group": "記憶の断片",
    "name": "三冊目の本",
    "image": "assets/relics/relic-07.png",
    "imageSource": "https://img.gamewith.jp/img/ca3b14665fac6a979fd5c3d446b65fac.png"
  },
  {
    "effects": [
      "【守護者】アーツ発動時、周囲の味方HPを徐々に回復",
      "【守護者】アビリティ発動中、ガード成功時、衝撃波が発生",
      "生命力+3"
    ],
    "group": "記憶の断片",
    "name": "魔女のブローチ / 砕けた魔女のブローチ",
    "image": "assets/relics/relic-08.png",
    "imageSource": "https://img.gamewith.jp/img/254a140d9e26b7be6add68bcf1619b7e.png"
  },
  {
    "effects": [
      "【鉄の目】弱点の持続時間を延長させる",
      "致命の一撃で、ルーンを取得"
    ],
    "group": "記憶の断片",
    "name": "割れた封蝋",
    "image": "assets/relics/relic-09.png",
    "imageSource": "https://img.gamewith.jp/img/554ac895b88c6df036a62a2e99d65df3.jpg"
  },
  {
    "effects": [
      "【鉄の目】アーツ発動後、刺突カウンター強化",
      "出撃時の武器に聖攻撃力を付加",
      "弓の攻撃力上昇"
    ],
    "group": "記憶の断片",
    "name": "聖律の刃",
    "image": "assets/relics/relic-10.png",
    "imageSource": "https://img.gamewith.jp/img/2265e5777f18897cb7aad8716d149c08.png"
  },
  {
    "effects": [
      "【レディ】スキルのダメージ上昇",
      "属性攻撃力が付加された時、属性攻撃力上昇"
    ],
    "group": "記憶の断片",
    "name": "金色の露",
    "image": "assets/relics/relic-11.png",
    "imageSource": "https://img.gamewith.jp/img/6820cc9e41c73b9bf95d0349c921b123.png"
  },
  {
    "effects": [
      "【レディ】短剣による攻撃連続時、周囲の敵に、直近の出来事を再演",
      "短剣の攻撃力上昇"
    ],
    "group": "記憶の断片",
    "name": "頭冠のメダル",
    "image": "assets/relics/relic-12.png",
    "imageSource": "https://img.gamewith.jp/img/99ff1f0202baee2e2445790e2010a3c7.png"
  },
  {
    "effects": [
      "【レディ】アーツ発動中、敵撃破で攻撃力上昇",
      "HP持続回復",
      "生命力+3"
    ],
    "group": "記憶の断片",
    "name": "祝福された鉄貨",
    "image": "assets/relics/relic-13.png",
    "imageSource": "https://img.gamewith.jp/img/3f8f1a6800d53d0feafd6b8ca816e3f5.png"
  },
  {
    "effects": [
      "【無頼漢】スキル中に攻撃を受けると攻撃力と最大スタミナ上昇",
      "筋力+3"
    ],
    "group": "記憶の断片",
    "name": "ちぎれた組み紐",
    "image": "assets/relics/relic-14.png",
    "imageSource": "https://img.gamewith.jp/img/bf700700665f235e8d9c59174409dc63.jpg"
  },
  {
    "effects": [
      "【無頼漢】トーテム・ステラの周囲で敵を倒した時、HP回復",
      "敵を倒した時、アーツゲージ増加",
      "強靭度+3"
    ],
    "group": "記憶の断片",
    "name": "黒爪の首飾り",
    "image": "assets/relics/relic-15.png",
    "imageSource": "https://img.gamewith.jp/img/986306fdcfb2cf39dae8ab3313102ad2.png"
  },
  {
    "effects": [
      "【復讐者】ファミリーと共闘中の間、自身を強化",
      "自身と味方の取得ルーン増加"
    ],
    "group": "記憶の断片",
    "name": "小さな化粧道具",
    "image": "assets/relics/relic-16.png",
    "imageSource": "https://img.gamewith.jp/img/74bf8dcc4ca3d69247bd6ec2a14db46e.jpg"
  },
  {
    "effects": [
      "【復讐者】アーツ発動時、霊炎の爆発を発生",
      "【復讐者】アーツ発動時、自身のHPと引き換えに周囲の味方のHPを全回復",
      "敵を倒した時、アーツゲージ増加"
    ],
    "group": "記憶の断片",
    "name": "古びたミニアチュール",
    "image": "assets/relics/relic-17.png",
    "imageSource": "https://img.gamewith.jp/img/5b11f2b6b766fe9c684577dc232443e4.jpg"
  },
  {
    "effects": [
      "【隠者】属性痕を集めた時、「魔術の地」が発動",
      "魔力攻撃力上昇+2"
    ],
    "group": "記憶の断片",
    "name": "夜の痕跡",
    "image": "assets/relics/relic-18.png",
    "imageSource": "https://img.gamewith.jp/img/2196f1adc8a0cb610da6bc4e242b9848.jpg"
  },
  {
    "effects": [
      "【隠者】アーツ発動時、最大HP上昇",
      "【隠者】アーツ発動時、自身が出血状態になり、攻撃力上昇",
      "知力+3"
    ],
    "group": "記憶の断片",
    "name": "骨のような石",
    "image": "assets/relics/relic-19.png",
    "imageSource": "https://img.gamewith.jp/img/e17b94e1e6fa96d28d6269005c473f3b.jpg"
  },
  {
    "effects": [
      "【執行者】スキル中、妖刀が解放状態になるとHP回復",
      "技量+3"
    ],
    "group": "記憶の断片",
    "name": "祝福された花",
    "image": "assets/relics/relic-20.png",
    "imageSource": "https://img.gamewith.jp/img/791345d18d36e0ba12c12065c9a36348.png"
  },
  {
    "effects": [
      "【執行者】アーツ発動中、咆哮でHP回復",
      "HP低下時、周囲の味方を含めHPをゆっくりと回復",
      "ガード成功時、HPを回復"
    ],
    "group": "記憶の断片",
    "name": "黄金の萌芽",
    "image": "assets/relics/relic-21.png",
    "imageSource": "https://img.gamewith.jp/img/43803dfde1cd083556d8d51a52b7fb46.jpg"
  },
  {
    "effects": [
      "【学者】アーツでリンクした敵対象に、継続ダメージ",
      "敵を倒した時、アーツゲージ増加",
      "属性カット率上昇"
    ],
    "group": "記憶の断片",
    "name": "清浄の雫",
    "image": "assets/relics/relic-22.png",
    "imageSource": "https://img.gamewith.jp/img/ea798302c1394bd92af6d768e34c37d6.png"
  },
  {
    "effects": [
      "【学者】スキルの進捗率の低下を抑制",
      "【学者】スキル使用時、対象に含まれた味方の攻撃力上昇",
      "スキルクールタイム軽減+3"
    ],
    "group": "記憶の断片",
    "name": "記録「後継者へ」",
    "image": "assets/relics/relic-23.png",
    "imageSource": "https://img.gamewith.jp/img/b8e9f0bd6ba174b05b0e6978ff15246c.png"
  },
  {
    "effects": [
      "【葬儀屋】祈祷を使用して、自身に補助効果発生時物理攻撃力上昇",
      "魔術／祈祷、効果時間延長",
      "物理攻撃力上昇+2"
    ],
    "group": "記憶の断片",
    "name": "片眼鏡の革袋",
    "image": "assets/relics/relic-24.png",
    "imageSource": "https://img.gamewith.jp/img/08b75a39c3330098d022c16e6926144e.png"
  },
  {
    "effects": [
      "【葬儀屋】アーツ発動時、攻撃力上昇",
      "攻撃連続時、攻撃力上昇",
      "アーツゲージ自然蓄積+3"
    ],
    "group": "記憶の断片",
    "name": "ガラスの首飾り",
    "image": "assets/relics/relic-25.png",
    "imageSource": "https://img.gamewith.jp/img/479c08f3c093222619dc25812b4c39dc.png"
  },
  {
    "effects": [
      "攻撃命中時、スタミナ回復+1",
      "出撃時の武器に炎攻撃力を付加"
    ],
    "group": "夜の王",
    "name": "獣の夜",
    "image": "assets/relics/relic-26.png",
    "imageSource": "https://img.gamewith.jp/img/04cd63f78136633c412f545cfaf58ff3.png"
  },
  {
    "effects": [
      "致命の一撃強化+1",
      "致命の一撃で、アーツゲージ増加",
      "致命の一撃で、スタミナ回復速度上昇"
    ],
    "group": "夜の王",
    "name": "爵の夜",
    "image": "assets/relics/relic-27.png",
    "imageSource": "https://img.gamewith.jp/img/63f86e6a27779fd12a14b13e219c7313.jpg"
  },
  {
    "effects": [
      "最大FP上昇",
      "出撃時の武器に毒の状態異常を付加",
      "周囲で毒／腐敗状態の発生時、攻撃力上昇"
    ],
    "group": "夜の王",
    "name": "識の夜",
    "image": "assets/relics/relic-28.png",
    "imageSource": "https://img.gamewith.jp/img/d5dafaa96c1a53f52d3360c80d614477.png"
  },
  {
    "effects": [
      "最大HP上昇",
      "聖杯瓶の回復を、周囲の味方に分配",
      "アイテムの効果が周囲の味方にも発動"
    ],
    "group": "夜の王",
    "name": "深海の夜",
    "image": "assets/relics/relic-29.png",
    "imageSource": "https://img.gamewith.jp/img/7b443e6d327bb22fe39ac14f91bf5440.jpg"
  },
  {
    "effects": [
      "出撃中、ショップでの購入に必要なルーンが大割引",
      "ジェスチャー「あぐら」により、発狂が蓄積",
      "発狂状態になると、FP持続回復"
    ],
    "group": "夜の王",
    "name": "魔の夜",
    "image": "assets/relics/relic-30.png",
    "imageSource": "https://img.gamewith.jp/img/77f195ca16aa0e2c203e4746d4657454.png"
  },
  {
    "effects": [
      "最大スタミナ上昇",
      "ガードカウンターに、自身の現在HPの一部を加える",
      "刺突カウンター発生時、HP回復"
    ],
    "group": "夜の王",
    "name": "狩人の夜",
    "image": "assets/relics/relic-31.png",
    "imageSource": "https://img.gamewith.jp/img/0c4e867afa40e7264dcf3e4dc03a9047.png"
  },
  {
    "effects": [
      "周囲で凍傷状態の発生時、自身の姿を隠す",
      "出撃時の武器の戦技を「冷気の霧」にする",
      "凍傷状態の敵に対する攻撃を強化"
    ],
    "group": "夜の王",
    "name": "霞の夜",
    "image": "assets/relics/relic-32.png",
    "imageSource": "https://img.gamewith.jp/img/20cf72978ae540fb36d00642b9bffbcc.png"
  },
  {
    "effects": [
      "武器の持ち替え時、いずれかの属性攻撃力を付加",
      "属性攻撃力が付加された時、属性攻撃力上昇",
      "武器の持ち替え時、物理攻撃力上昇"
    ],
    "group": "夜の王",
    "name": "王の夜",
    "image": "assets/relics/relic-33.png",
    "imageSource": "https://img.gamewith.jp/img/c71680263a2cf20aff60713aeec0328a.png"
  },
  {
    "effects": [
      "近接攻撃力上昇",
      "戦技攻撃力上昇",
      "FP持続回復"
    ],
    "group": "夜の王",
    "name": "安寧者の遺志",
    "image": "assets/relics/relic-34.png",
    "imageSource": "https://img.gamewith.jp/img/4e5b9bd53ce16fd1617e88d7ecba9592.png"
  },
  {
    "effects": [
      "状態異常ゲージがある時、徐々に攻撃力上昇",
      "被ダメージ時、腐敗の状態異常を付加",
      "周囲で腐敗状態の発生時、HP持続回復"
    ],
    "group": "夜の王",
    "name": "瓦礫の夜",
    "image": "assets/relics/relic-35.png",
    "imageSource": "https://img.gamewith.jp/img/0af6eee260a14220612a97f9031b9a87.png"
  },
  {
    "effects": [
      "攻撃命中時、スタミナ回復+1",
      "攻撃を受けると攻撃力上昇",
      "炎攻撃力上昇+2"
    ],
    "group": "常夜の王/救いの旗手",
    "name": "獣の暗き夜",
    "image": "assets/relics/relic-36.png",
    "imageSource": "https://img.gamewith.jp/img/4f73a83929b5784118add1149320fbd5.png"
  },
  {
    "effects": [
      "致命の一撃強化+1",
      "致命の一撃強化",
      "致命の一撃で、ルーンを取得"
    ],
    "group": "常夜の王/救いの旗手",
    "name": "爵の暗き夜",
    "image": "assets/relics/relic-37.png",
    "imageSource": "https://img.gamewith.jp/img/d718dda519c9395ef88d07f6ddf104b4.jpg"
  },
  {
    "effects": [
      "最大FP上昇",
      "攻撃連続時、FP回復",
      "魔術師塔の仕掛けが解除される度、最大FP上昇"
    ],
    "group": "常夜の王/救いの旗手",
    "name": "識の暗き夜",
    "image": "assets/relics/relic-38.png",
    "imageSource": "https://img.gamewith.jp/img/0c17d97dbfcc53861dbc7a919ee3429b.png"
  },
  {
    "effects": [
      "最大HP上昇",
      "HP持続回復",
      "HP低下時、周囲の味方を含めHPをゆっくりと回復"
    ],
    "group": "常夜の王/救いの旗手",
    "name": "深海の暗き夜",
    "image": "assets/relics/relic-39.png",
    "imageSource": "https://img.gamewith.jp/img/4eb3309b58b997ca557cde5ff4f7ec07.jpg"
  },
  {
    "effects": [
      "攻撃を受けると攻撃力上昇",
      "ジェスチャー「あぐら」により、発狂が蓄積",
      "発狂状態になると、FP持続回復"
    ],
    "group": "常夜の王/救いの旗手",
    "name": "魔の暗き夜",
    "image": "assets/relics/relic-40.png",
    "imageSource": "https://img.gamewith.jp/img/dd290171af12b0953d7ea89b7702d997.png"
  },
  {
    "effects": [
      "最大スタミナ上昇",
      "属性攻撃力が付加された時、属性攻撃力上昇",
      "敵を倒した時、アーツゲージ増加"
    ],
    "group": "常夜の王/救いの旗手",
    "name": "狩人の暗き夜",
    "image": "assets/relics/relic-41.png",
    "imageSource": "https://img.gamewith.jp/img/7fdf3e215faec726d3d37850cde3a2c3.png"
  },
  {
    "effects": [
      "周囲で凍傷状態の発生時、自身の姿を隠す",
      "出撃時の武器に冷気の状態異常を付加",
      "物理カット率上昇"
    ],
    "group": "常夜の王/救いの旗手",
    "name": "霞の暗き夜",
    "image": "assets/relics/relic-42.png",
    "imageSource": "https://img.gamewith.jp/img/5f4d5d958c21445f412c7c7093b14e46.png"
  },
  {
    "effects": [
      "近接攻撃力上昇",
      "戦技攻撃力上昇",
      "カット率低下時、稀に敵から受ける攻撃を無効化"
    ],
    "group": "常夜の王/救いの旗手",
    "name": "安寧の遺志",
    "image": "assets/relics/relic-43.png",
    "imageSource": "https://img.gamewith.jp/img/e02779530ff96e9c123291a4ed1c6e72.png"
  }
];
EFFECTS.push({id:'normal:属性カット率上昇',type:'normal',category:'固有遺物専用',name:'属性カット率上昇',character:'',hasPenalty:false,uniqueOnly:true,summary:'属性ダメージを約7%軽減。清浄の雫に付く固有遺物専用効果。'});
const UNIQUE_RELIC_COLORS=['青','緑','青','赤','赤','赤','赤','赤','青','黄','黄','黄','緑','緑','青','黄','青','青','緑','緑','緑','赤','赤','黄','青','緑','緑','青','黄','赤','赤','緑','黄','青','青','赤','黄','赤','緑','青','青','黄','緑','赤'];
UNIQUE_RELICS.forEach((relic,index)=>{relic.id='unique-'+String(index+1).padStart(2,'0');relic.color=UNIQUE_RELIC_COLORS[index];relic.originalImage=relic.image;relic.image=`assets/relics/cutout-${String(index).padStart(2,'0')}.webp`;});
const SHOP_RELICS=[
  {
    "id": "shop-01",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "【追跡者】アーツ発動時、周囲を延焼",
      "出撃時の武器の戦技を「炎撃」にする",
      "炎攻撃力上昇+2"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-02",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "【追跡者】精神力上昇、生命力低下",
      "生命力+3",
      "精神力+3"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-03",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "【追跡者】知力/信仰上昇、筋力/技量低下",
      "知力+3",
      "信仰+3"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-04",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "【守護者】アビリティ発動中、ガード成功時、衝撃波が発生",
      "ガード成功時、アーツゲージ増加",
      "持久力+3"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-05",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "【守護者】筋力/技量上昇、生命力低下",
      "筋力+3",
      "技量+3"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-06",
    "name": "壮大な輝く景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "黄",
    "size": "大",
    "effects": [
      "【守護者】精神力/信仰上昇、生命力低下",
      "精神力+3",
      "信仰+3"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-07",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "【レディ】背後からの致命の一撃後、自身の姿を見え難くし、足音を消す",
      "致命の一撃強化",
      "スキルクールタイム軽減+2"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-08",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "【レディ】生命力/筋力上昇、精神力低下",
      "生命力+3",
      "筋力+3"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-09",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "【レディ】精神力/信仰上昇、知力低下",
      "精神力+3",
      "信仰+3"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-10",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "杖の武器種を3つ以上装備していると最大FP上昇",
      "魔術師塔の仕掛けが解除される度、最大FP上昇",
      "魔力攻撃力上昇"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-11",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "【隠者】生命力/持久力/技量上昇、知力/信仰低下",
      "生命力+3",
      "持久力+3"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-12",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "【隠者】知力/信仰上昇、精神力低下",
      "知力+3",
      "信仰+3"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-13",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "【鉄の目】アーツのタメ発動時、毒の状態異常を付加",
      "毒状態の敵に対する攻撃を強化",
      "アーツゲージ自然蓄積+3"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-14",
    "name": "壮大な輝く景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "黄",
    "size": "大",
    "effects": [
      "【鉄の目】生命力/筋力上昇、技量低下",
      "生命力+3",
      "筋力+3"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-15",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "【鉄の目】神秘上昇、技量低下",
      "技量+3",
      "神秘+3"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-16",
    "name": "壮大な輝く景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "黄",
    "size": "大",
    "effects": [
      "【無頼漢】アーツの効果時間延長",
      "特大武器の攻撃力上昇",
      "持久力+3"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-17",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "【無頼漢】精神力/知力上昇、生命力/持久力低下",
      "精神力+3",
      "知力+3"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-18",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "【無頼漢】神秘上昇、生命力低下",
      "生命力+3",
      "神秘+3"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-19",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "【復讐者】アーツ発動時、ファミリーと味方を強化",
      "アイテムの効果が周囲の味方にも発動",
      "出撃時に「星光の欠片」を持つ"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-20",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "【復讐者】生命力/持久力上昇、精神力低下",
      "生命力+3",
      "持久力+3"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-21",
    "name": "壮大な輝く景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "黄",
    "size": "大",
    "effects": [
      "【復讐者】筋力上昇、信仰低下",
      "筋力+3",
      "信仰+3"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-22",
    "name": "壮大な輝く景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "黄",
    "size": "大",
    "effects": [
      "【執行者】スキル中の攻撃力上昇、攻撃時にカット率低下",
      "ガード成功時、HPを回復",
      "ガード成功時、アーツゲージ増加"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-23",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "【執行者】生命力/持久力上昇、神秘低下",
      "生命力+3",
      "持久力+3"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-24",
    "name": "壮大な輝く景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "黄",
    "size": "大",
    "effects": [
      "【執行者】技量/神秘上昇、生命力低下",
      "技量+3",
      "神秘+3"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-25",
    "name": "壮大な輝く景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "学者で常夜の王撃破",
    "isShop": true,
    "color": "黄",
    "size": "大",
    "effects": [
      "【学者】スキルによる標本が増える度、ルーンを取得",
      "出撃時に「小さなポーチ」を持つ",
      "出撃時に「小さなポーチ」を持つ"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-26",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "【学者】精神力上昇、生命力低下",
      "生命力+3",
      "精神力+3"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-27",
    "name": "壮大な輝く景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "黄",
    "size": "大",
    "effects": [
      "【学者】持久力/技量上昇、知力/神秘低下",
      "持久力+3",
      "技量+3"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-28",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "葬儀屋で常夜の王撃破",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "【葬儀屋】アーツ発動時、触れた味方のHP回復",
      "ダメージを受けた直後、攻撃によりHPの一部を回復",
      "敵を倒した時、アーツゲージ増加"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-29",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "【葬儀屋】技量上昇、生命力/信仰低下",
      "生命力+3",
      "技量+3"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-30",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "「瓦礫の王」撃破(DLC)",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "【葬儀屋】精神力/信仰上昇、筋力低下",
      "精神力+3",
      "信仰+3"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-31",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "HP低下時、周囲の味方を含めHPをゆっくりと回復",
      "HP低下時、カット率上昇",
      "生命力+3"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-32",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "両手持ちの、体勢を崩す力上昇",
      "通常攻撃の1段目強化",
      "強靭度+3"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-33",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "二刀持ちの、体勢を崩す力上昇",
      "攻撃命中時、スタミナ回復",
      "持久力+3"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-34",
    "name": "壮大な輝く景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "黄",
    "size": "大",
    "effects": [
      "封牢の囚を倒す度、攻撃力上昇",
      "埋もれ宝の位置を地図に表示",
      "出撃時に「石剣の鍵」を持つ"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-35",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "出撃時に「星光の欠片」を持つ",
      "出撃時に「星光の欠片」を持つ",
      "出撃時に「星光の欠片」を持つ"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-36",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "学者で常夜の王撃破",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "苔薬などのアイテム使用でHP回復",
      "アイテムの効果が周囲の味方にも発動",
      "出撃時に「小さなポーチ」を持つ"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-37",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "学者で常夜の王撃破",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "大教会の強敵を倒す度、最大HP上昇",
      "遺跡の強敵を倒す度、神秘上昇",
      "魔術師塔の仕掛けが解除される度、最大FP上昇"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-38",
    "name": "壮大な輝く景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "葬儀屋で常夜の王撃破",
    "isShop": true,
    "color": "黄",
    "size": "大",
    "effects": [
      "致命の一撃で、アーツゲージ増加",
      "敵を倒した時、アーツゲージ増加",
      "アーツゲージ自然蓄積+3"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-39",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "コレクターの看板",
    "note": "葬儀屋で常夜の王撃破",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "攻撃を受けると攻撃力上昇",
      "ダメージで吹き飛ばされた時、強靭度とカット率上昇",
      "物理攻撃力上昇+2"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-40",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "ラスボス撃破後",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "自身と味方の取得ルーン増加",
      "出撃時に「石剣の鍵」を持つ",
      "出撃中、ショップでの購入に必要なルーンが割引"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-41",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "ラスボス撃破後",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "ダメージを受けた直後、攻撃によりHPの一部を回復",
      "生命力+2",
      "強靭度+2"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-42",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王4体撃破後",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "【追跡者】アーツ発動時、周囲を延焼",
      "筋力+2",
      "技量+2"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-43",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王4体撃破後",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "【守護者】アビリティ発動中、ガード成功時、衝撃波が発生",
      "生命力+2",
      "持久力+2"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-44",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王4体撃破後",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "【レディ】スキルのダメージ上昇",
      "技量+2",
      "知力+2"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-45",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王4体撃破後",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "【隠者】アーツ発動時、自身が出血状態になり、攻撃力上昇",
      "精神力+2",
      "知力+2"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-46",
    "name": "壮大な輝く景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王4体撃破後",
    "isShop": true,
    "color": "黄",
    "size": "大",
    "effects": [
      "【鉄の目】弱点の持続時間を延長させる",
      "持久力+2",
      "技量+2"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-47",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王4体撃破後",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "【無頼漢】トーテム・ステラの周囲で、強靭度上昇",
      "生命力+2",
      "筋力+2"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-48",
    "name": "壮大な滴る景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王4体撃破後",
    "isShop": true,
    "color": "青",
    "size": "大",
    "effects": [
      "【復讐者】アーツ発動時、霊炎の爆発を発生",
      "信仰+2",
      "神秘+2"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-49",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王4体撃破後",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "【執行者】アーツ発動中、咆哮でHP回復",
      "技量+2",
      "神秘+2"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-50",
    "name": "壮大な燃える景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "ハルモニア撃破後(要DLC)",
    "isShop": true,
    "color": "赤",
    "size": "大",
    "effects": [
      "【学者】スキルの進捗率の低下を抑制",
      "知力+2",
      "神秘+2"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-51",
    "name": "壮大な静まる景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "ハルモニア撃破後(要DLC)",
    "isShop": true,
    "color": "緑",
    "size": "大",
    "effects": [
      "【葬儀屋】連撃の最終攻撃命中時、攻撃力上昇",
      "筋力+2",
      "信仰+2"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-52",
    "name": "端正な燃える景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王3体撃破後",
    "isShop": true,
    "color": "赤",
    "size": "中",
    "effects": [
      "輝石、重力石アイテムの攻撃力上昇",
      "出撃時に「小さなポーチ」を持つ"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-53",
    "name": "端正な静まる景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王3体撃破後",
    "isShop": true,
    "color": "緑",
    "size": "中",
    "effects": [
      "聖杯瓶の回復を、周囲の味方に分配",
      "敵を倒した時、自身を除く周囲の味方のHPを回復"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-54",
    "name": "端正な輝く景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王3体撃破後",
    "isShop": true,
    "color": "黄",
    "size": "中",
    "effects": [
      "毒耐性上昇",
      "腐敗耐性上昇"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-55",
    "name": "端正な輝く景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王3体撃破後",
    "isShop": true,
    "color": "黄",
    "size": "中",
    "effects": [
      "出血耐性上昇",
      "冷気耐性上昇"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-56",
    "name": "端正な滴る景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王3体撃破後",
    "isShop": true,
    "color": "青",
    "size": "中",
    "effects": [
      "睡眠耐性上昇",
      "発狂耐性上昇"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-57",
    "name": "端正な滴る景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "夜の王3体撃破後",
    "isShop": true,
    "color": "青",
    "size": "中",
    "effects": [
      "精神力+3",
      "抗死耐性上昇"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-58",
    "name": "端正な静まる景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "グラディウス撃破後",
    "isShop": true,
    "color": "緑",
    "size": "中",
    "effects": [
      "脂アイテム使用時、追加で物理攻撃力上昇",
      "持久力+3"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-59",
    "name": "端正な滴る景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "グラディウス撃破後",
    "isShop": true,
    "color": "青",
    "size": "中",
    "effects": [
      "ガード中、敵に狙われやすくなる",
      "生命力+3"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-60",
    "name": "端正な燃える景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "グラディウス撃破後",
    "isShop": true,
    "color": "赤",
    "size": "中",
    "effects": [
      "アーツゲージ自然蓄積+2",
      "魔力カット率上昇"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-61",
    "name": "端正な静まる景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "グラディウス撃破後",
    "isShop": true,
    "color": "緑",
    "size": "中",
    "effects": [
      "スキルクールタイム軽減+2",
      "炎カット率上昇"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-62",
    "name": "端正な静まる景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "グラディウス撃破後",
    "isShop": true,
    "color": "緑",
    "size": "中",
    "effects": [
      "スキルクールタイム軽減+2",
      "雷カット率上昇"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-63",
    "name": "端正な燃える景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "グラディウス撃破後",
    "isShop": true,
    "color": "赤",
    "size": "中",
    "effects": [
      "アーツゲージ自然蓄積+2",
      "聖カット率上昇"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-64",
    "name": "繊細な燃える景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "初期",
    "isShop": true,
    "color": "赤",
    "size": "小",
    "effects": [
      "出撃時に「火炎壺」を持つ"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-65",
    "name": "繊細な滴る景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "初期",
    "isShop": true,
    "color": "青",
    "size": "小",
    "effects": [
      "出撃時の武器に魔力攻撃力を付加"
    ],
    "image": "assets/icons/relic-blue.png"
  },
  {
    "id": "shop-66",
    "name": "繊細な輝く景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "初期",
    "isShop": true,
    "color": "黄",
    "size": "小",
    "effects": [
      "出撃時に「雷脂」を持つ"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  },
  {
    "id": "shop-67",
    "name": "繊細な静まる景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "初期",
    "isShop": true,
    "color": "緑",
    "size": "小",
    "effects": [
      "出撃時の武器の戦技を「聖なる刃」にする"
    ],
    "image": "assets/icons/relic-crystal.png"
  },
  {
    "id": "shop-68",
    "name": "端正な燃える景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "初期",
    "isShop": true,
    "color": "赤",
    "size": "中",
    "effects": [
      "投擲壺の攻撃力上昇",
      "投擲ナイフの攻撃力上昇"
    ],
    "image": "assets/icons/relic-red.png"
  },
  {
    "id": "shop-69",
    "name": "繊細な輝く景色",
    "group": "店売り遺物",
    "shop": "小壺商人のバザー",
    "note": "初期",
    "isShop": true,
    "color": "黄",
    "size": "小",
    "effects": [
      "致命の一撃強化"
    ],
    "image": "assets/icons/relic-yellow-round.png"
  }
];
for(const sr of SHOP_RELICS){
  for(const effName of sr.effects){
    if(!EFFECTS.some(e=>e.type==='normal'&&e.name===effName)){
      const deepEff=EFFECTS.find(e=>e.type==='deep'&&e.name===effName);
      EFFECTS.push({
        id:'normal:'+effName,
        type:'normal',
        category:deepEff?deepEff.category:'店売り遺物専用',
        name:effName,
        character:deepEff?deepEff.character:'',
        hasPenalty:false,
        uniqueOnly:true,
        summary:deepEff?deepEff.summary:''
      });
    }
  }
}
UNIQUE_RELICS.push(...SHOP_RELICS);
for(const relic of UNIQUE_RELICS){relic.effectIds=relic.effects.map(name=>'normal:'+name);while(relic.effectIds.length<3)relic.effectIds.push(null);}
