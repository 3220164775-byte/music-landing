# 让热爱，有回响

一个网易云音乐产品介绍的非官方概念落地页，参考 24/7 Artists 的音乐视觉语言。整站由四个主要画面组成：唱片机、专辑封面、音乐地球和音乐连接世界。第二屏展示十七张真实歌曲原专辑封面，以及一张用户提供的旋转转场图片；试听使用原创合成旋律。

## 本地预览

最简单的方式是直接用浏览器打开 `index.html`，页面和试听均可使用。

如果已经安装 Python，也可以在项目目录运行：

```sh
python3 -m http.server 8080
```

打开 `http://localhost:8080`。

## GitHub Pages

1. 将项目文件上传到 GitHub 仓库。
2. 打开仓库 **Settings → Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择存放文件的分支（通常为 `main`），目录选择 **/ (root)**，然后保存。
5. 部署完成后，通过 Pages 设置页显示的地址访问。

可参考 [GitHub 官方部署说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

用户或组织主页仓库（`用户名.github.io`）通常使用 `https://用户名.github.io/`；其他项目仓库通常使用 `https://用户名.github.io/仓库名/`。项目使用相对资源路径，两种地址均可使用。

无需安装依赖、无需构建，也无需服务器端服务。

## 页面内容

第一页保留原唱片机风格；第二至第四屏统一为深蓝紫音乐现场视觉，使用紫色与青色舞台光、白色标题和紫色圆角按钮。专辑直接展示方形原封面，不带白边、信息栏或装饰按钮；最后一屏采用宇宙背景中的人物关系图。

- 全屏水下唱片机首屏、蓝紫色票券导航、随滚动展开的音乐开场。
- 下滑依次呈现唱针落下、水波扩大、首屏逐渐模糊，再从中心显现专辑封面；向上滑动可倒回。落针前水面倒影与机身一起轻微折射，落针后机身保持稳定、倒影随着圆形波纹折射，波峰与波谷呈现明暗起伏。
- 第二屏采用中央大标题、四周错落散布封面的布局。十七张真实专辑封面和一张转场图片从上方依次洒下，约两秒完成入场，带不同倾角和轻微回弹，停留在散落的位置后缓缓漂动。鼠标悬停或键盘聚焦时停住并突出对应封面，移开后继续；点击封面锁定查看，可用“继续飘落”恢复。封面和转场图片不触发其他原创示例的试听。
- 第二屏继续下滑时，用户提供的 James Blake 音乐时间轴图片旋转并放大至覆盖整屏，短暂停留后再缩入第三屏周杰伦歌单的「七里香」歌曲行；向上滚动可倒回原封面。过渡跟随滚动位置，开启减少动态效果偏好时直接切换场景。
- 第三屏为鱼眼透视风格的音乐地球：鼠标悬停在球面并移动即可旋转，不需要按住鼠标；手机滑动、方向键或左右按钮也可旋转。歌手随所在地域转至正面而出现，悬停歌手时显示姓名并暂停旋转，右侧同步显示其歌曲列表。
- 歌曲列表按曲面排布并从中间向边缘降低透明度，可独立用滚轮、触摸或方向键上下滚动。滚动距离触发短促的原创合成齿轮音效，停止滚动即停止发声；支持单独关闭音效，并遵循播放器静音状态。首次未解锁音频时可点击“开启齿轮音效”。手机采用上下布局，国家按钮可横向滑动；点击国家可转向对应地域并选择歌手。
- 唱片机包含惯性启停，与试听播放器同步。支持 33⅓ / 45 转速、静音、从头播放；45 转同时加快试听速度。
- 下滑时尝试开始原创试听。浏览器可能要求先点击“开启声音”或唱片机，视觉过渡始终可随滚动查看。开启减少动态效果偏好时直接显示两部分内容。
- 第四屏是一张随下滑扩展的人物音乐关系图。人物从圆心向外不规则散布，连线采用轻微弯曲的路径；小标语放在正上方，关系图占据画面主体。进入时四位虚构听众以较长连线相连，人物之间保留较大间距；继续下滑时原有连线逐渐缩短，更多听众出现在周围，视角同时拉远，人物越来越小。桌面最终呈现 108 个节点，手机呈现 64 个节点，减少最终画面的密集程度。宇宙背景以远处星云和不同深度的星点构成，随下滑产生不同速度的收拢和缩小，形成向远处拉开的纵深；星云缓慢缩放，近处星点移动比远处更明显。向上滚动可倒回最初的小群体和宇宙视角。该屏在滚动过程中固定在视口内，整站仍为四个主要画面。
- 播放原创试听时，光点沿听众之间的连线传递，亮度响应音频分析的低频能量；暂停或静音时停止传递。减少动态效果模式直接显示完整静态关系网，音乐仍可播放。离开画面或切到后台时停止动画。
- 人物照片复用内置图像工具生成的十六位虚构听众，随着视角缩小组成更大的概念网络；城市、数量和关系均为演示，不代表真实用户或实时在线人数。
- 原搜索、风格筛选和独立下载板块已收起，整站只保留四个主要画面。官网客户端下载入口和回到首页入口融入第四屏底部。
- 包含六张原创封面及六段 16 秒原创合成音乐素材；当前旅程试听默认使用「夜航」，播放器支持暂停与关闭。首次仅用滚轮下滑可能被浏览器拦截自动播放，此时保留可点击的播放入口；点击即可开启声音。
- 手机与桌面响应式布局、键盘访问、减少动态效果偏好支持；减少动态效果时封面改为静态专辑网格，地球支持手动旋转。

页面不连接网易云音乐曲库。下载入口打开网易云音乐官方站点。

环球音乐是页面内的歌手主页展示，包含 9 位歌手/组合和精选曲目名称。点击曲目会选中该行，不播放商业歌曲；与原创试听播放器区分。地球上的歌手图标使用原创字母徽章，不使用艺人肖像；歌单中对应的专辑使用第二屏的真实封面。地点作为相应音乐地域的入口，不表示艺人的实时位置。

## 文件

```text
index.html       页面内容
styles.css       样式和响应式布局
turntable.css    唱片机外观
turntable.js     唱片惯性、唱臂及控件
intro.css        全屏开场与第二部分的视觉过渡
intro.js         滚动进度、落针、模糊及中心显现
journey.css      专辑洒落、鱼眼地球与曲面歌单
journey.js       专辑洒落、冻结、封面到歌曲行的转场、球面投影与歌单联动
assets/cover-catalog.js  真实歌曲、原专辑封面链接及来源
stage-theme.css 第二至第四屏的舞台主题
resonance.css    第四屏固定视口与人物关系网布局
resonance.js     人物关系图、滚动拉远、节点逐层出现与音乐光点
app.js           试听播放器和各屏互动联动
assets/          原创 SVG 封面和音频
scripts/         原创素材生成脚本
```

`scripts/create_assets.py` 是素材生成脚本，需要 NumPy；已生成的素材包含在仓库中，运行网页不需要执行它。

`scripts/check-preview.cjs` 是可选的浏览器检查脚本，需要已安装 Playwright 和浏览器。可以通过 `PREVIEW_URL` 指定预览地址，通过 `PLAYWRIGHT_BROWSER_EXECUTABLE` 指定浏览器路径。

`scripts/check-resonance.cjs` 检查四屏结构、听众逐步增多、人物缩小、固定视口、反向滚动与音乐光点、暂停/静音/继续、键盘操作、手机布局及减少动态效果。

`scripts/check-journey.cjs` 检查真实专辑封面加载、错落下落、悬停冻结/恢复、封面到对应歌曲行的转场及倒回、无需按键的鼠标移动旋转、9 位地域歌手、歌曲列表联动、手机与减少动态效果模式。

`scripts/check-song-scroll.cjs` 检查曲面歌单独立滚动、键盘及手机滑动、齿轮音效触发、停止及静音、单独关闭音效，以及切换歌手时无音效的复位。

`scripts/create_world_assets.py` 从已包含的 `assets/world-land.geojson` 生成 `assets/world-land.js`，运行网页不需要执行脚本或在线加载地图。地图来自 [Natural Earth 1:110m 陆地数据](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson)，使用 [公共领域许可](https://www.naturalearthdata.com/about/terms-of-use/)。地球采用真实经纬度球面投影和风格化点阵大陆轮廓。

十八张真实封面通过发行平台的公开图片地址加载，图片未作为本项目原创素材打包，显示封面需要联网。`assets/cover-catalog.js` 保留每张封面的对应专辑来源。真实专辑封面的权利属于各自权利人，不包含在本项目的 MIT 授权中。

代码及本项目原创素材使用 MIT 许可证。网易云音乐名称、商标及品牌权利属于其权利人，不包含在 MIT 授权中。本项目不是网易云音乐官方产品或官方页面。

设计参考：[24/7 Artists 制作案例](https://tympanus.net/codrops/2025/04/16/case-study-24-7-artists/)。未使用该站点的源码或图片。

首页唱片机效果改编自用户提供的 DeepSeek 生成页面，保留机身、唱臂和唱片惯性，滚动转场改为水波折射，改为使用本项目统一的音频播放器。参考原文件不随仓库分发。

## 歌手曲目信息来源

精选曲目来自以下官方页面或发行方在 Apple Music 上发布的专辑信息，不包含音源与歌词：

- 周杰伦：[七里香](https://music.apple.com/us/album/%E4%B8%83%E9%87%8C%E9%A6%99/1721450027)
- 宇多田光：[First Love](https://www.utadahikaru.jp/music/s3wh8daae6q/)
- BTS：[BE 官方专辑页](https://bts.ibighit.com/eng/discography/detail/be.html)
- Adele：[30](https://music.apple.com/us/album/30/1590035691)
- Daft Punk：[Random Access Memories 官方专辑页](https://www.daftpunk.com/randomaccessmemories/)
- Billie Eilish：[HIT ME HARD AND SOFT](https://music.apple.com/us/album/hit-me-hard-and-soft/1739659134)
- The Weeknd：[After Hours](https://music.apple.com/us/album/after-hours/1499385848)
- Anitta：[Versions of Me](https://music.apple.com/us/album/versions-of-me/1618274896)
- Tyla：[TYLA](https://music.apple.com/us/album/priorities/1717680174)

## 第二屏真实封面

| 歌曲 / 展示名称 | 歌手 | 对应专辑 |
| --- | --- | --- |
| 七里香 | 周杰伦 | [七里香](https://music.apple.com/us/album/%E4%B8%83%E9%87%8C%E9%A6%99/1721450027) |
| Life Goes On | BTS | [BE](https://music.apple.com/us/album/be/1596532185) |
| Easy On Me | Adele | [30](https://music.apple.com/us/album/30/1590035691) |
| Get Lucky | Daft Punk | [Random Access Memories](https://music.apple.com/us/album/random-access-memories/617154241) |
| BIRDS OF A FEATHER | Billie Eilish | [HIT ME HARD AND SOFT](https://music.apple.com/us/album/hit-me-hard-and-soft/1739659134) |
| Blinding Lights | The Weeknd | [After Hours](https://music.apple.com/us/album/after-hours/1499385848) |
| First Love | Hikaru Utada | [First Love (Remastered 2014)](https://music.apple.com/us/album/first-love-remastered-2014/1440763349) |
| Water | Tyla | [TYLA](https://music.apple.com/us/album/tyla/1717680174) |
| 1989 | Taylor Swift | [1989](https://music.apple.com/us/album/1989/1440935467) |
| 24K Magic | Bruno Mars | [24K Magic](https://music.apple.com/us/album/24k-magic/1161503945) |
| Born To Die | Lana Del Rey | [Born To Die](https://music.apple.com/us/album/born-to-die/1779781213) |
| In Rainbows | Radiohead | [In Rainbows](https://music.apple.com/us/album/in-rainbows/1109714933) |
| DAMN. | Kendrick Lamar | [DAMN.](https://music.apple.com/us/album/damn/1440881722) |
| Discovery | Daft Punk | [Discovery](https://music.apple.com/us/album/discovery/697194953) |
| 21 | Adele | [21](https://music.apple.com/us/album/21/1544491232) |
| Dawn FM | The Weeknd | [Dawn FM](https://music.apple.com/us/album/dawn-fm/1603164027) |
| Love Yourself 結 'Answer' | BTS | [Love Yourself 結 'Answer'](https://music.apple.com/us/album/love-yourself-%E7%B5%90-answer/1598730614) |
| OK Computer | Radiohead | [OK Computer](https://music.apple.com/us/album/ok-computer/1097861387) |

## 舞台背景素材

首页的 `assets/water-reflections-v1.png` 由内置 image_gen 工具生成，为带真实 Alpha 通道的水面倒影叠加层；完整生成提示词保存在 `assets/water-reflections-v1.prompt.md`。图像在唱片机上方叠加，中央透明区域保留机身细节。倒影单独以 SVG 色彩滤镜调成蓝紫色，保留原图透明度，与后三屏色调统一。落针前，倒影与机身共用水面折射场；落针后机身保持稳定，倒影按圆形波纹单独折射。顶部导航采用与第三屏一致的蓝紫色。

`assets/stage-concert.jpg` 为内置图像生成工具生成的音乐现场背景，未使用参考网站的摄影素材。原始生成提示词保存于 `assets/stage-concert-prompt.txt`。适合本项目后三屏的深蓝紫、紫青舞台灯、观众剪影以及中央留白。

旋转转场使用 `assets/rotation-cover-reference.png`，来自用户提供的图片，保留整张画面。第二屏该图的标题单独显示为音乐时间轴；缩入第三屏后，「七里香」歌曲行继续保留这张图片的缩小版，包括重新选择周杰伦时。

第三屏保留原有歌名，按用户选择使用每位歌手不同发行作品的封面作为视觉展示，封面与当前歌名不代表真实发行对应关系。54 张展示封面的公开 Apple Music / iTunes 来源与发行名称记录在 `assets/song-artwork-catalog.js`，无需运行时调用搜索服务。

## 听众照片素材

`assets/listeners-grid.jpg` 为内置 image_gen 生成的 4×4 摄影风格虚构人像拼图，原始提示词保存在 `assets/listeners-grid-prompt.txt`。关系网和连线由浏览器实时绘制。

## 宇宙背景素材

`assets/cosmos-nebula.jpg` 为内置 image_gen 生成的深蓝紫星云背景；完整提示词保存于 `assets/cosmos-nebula-prompt.txt`。星云作为远景缓慢缩放，Canvas 星点按各自深度进行透视投影，近星比远星更快向中心收拢并缩小，与人物网络的拉远运动共同形成纵深。所有资源保存在项目内，不依赖外部背景图服务；减少动态效果时显示静态宇宙与完整关系网。
