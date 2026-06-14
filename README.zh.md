# Rustype

<img src="src-tauri/icons/128x128@2x.png" alt="Logo" width="128" height="128">

轻量化高性能 Markdown 桌面编辑器

## 项目背景

marktext 拥有业界优秀的 Markdown 实时编辑体验。本项目借鉴 marktext 成熟完善的 Markdown 交互逻辑与编辑能力，以其完善的编辑能力作为功能基准，完成全栈技术架构重构，同时对整体用户体验进行全新独立设计。

## 技术栈

- Tauri
- React

## 技术特性

### 懒加载目录树

- 初始加载仅显示根目录，避免加载过深目录导致性能问题
- 用户展开目录时才动态加载子目录内容
- 适用于大型项目或嵌套层级较深的文件结构

### 最近文件

- 文件与文件夹分类显示，便于快速区分

## 贡献

欢迎提交 Pull Request！

## 致谢

由衷感谢 [marktext](https://github.com/marktext/marktext) 开源项目提供成熟完善的 Markdown 编辑参考方案，为本项目的功能设计与落地提供了宝贵的思路与启发。

## 许可证

本项目采用 **Rustype 自定义许可证（RPCL v1.0）**，允许免费使用和修改源代码，但包含以下限制：

- ❌ **禁止** 在任何应用商店发布衍生作品
- ❌ **禁止** 用于商业用途（需书面授权）
- ❌ **禁止** 使用 "Rustype" 名称或相关品牌标识
- ✅ **允许** 个人或非商业用途的自由使用与修改

完整条款请参阅：[LICENSE](LICENSE)

商业授权请联系：`fuxing.zhang@qq.com`

## 支持项目

如果这个项目对你有帮助，欢迎请我喝杯咖啡 ☕

<table>
  <tr>
    <td>
      <img src="sponsor/weixin.jpg" width="200"/>
    </td>
    <td width="100" align="center" > 🙏 </td>
    <td>
      <img src="sponsor/alipay.jpg" width="200"/>
    </td>
  </tr>
</table>
