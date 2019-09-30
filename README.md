# Enhanced Scripts

> 此项目是基于 [react-scripts](https://github.com/facebook/create-react-app/tree/master/packages/react-scripts) 修改而来，当中融合了[Elixir Phoenix Umbrella 项目结构](https://medium.com/@cedric_30386/how-to-build-multiple-web-apps-with-elixir-thanks-to-umbrella-part-2-set-up-the-project-800d6d731dbd)
>
> 与 Phoenix Umbrella 不同的是，每个`enhanced-scripts`都可以管理自己的项目依赖，不会出现依赖版本冲突的问题

### Examples

    ```bash

        git clone https://github.com/Fi2zz/enhanced-scripts.git

        cd enhanced-scripts && node examples start
        或

        cd enhanced-scripts && node examples build

    ```

### 项目结构

    project_root
    |-webpack.config.js //如果有
    |-<build-config>.yaml //如果有
    |-apps
    | |-<app_name>
    | |--index.js
    | |--package.json
    | |--webpack.config.js //如果有

### 安装

yarn

```bash
yarn add https://github.com/Fi2zz/enhanced-scripts.git
```

npm

```bash
  npm install https://github.com/Fi2zz/enhanced-scripts.git
```

### 命令

```bash
enhanced-scripts build
//运行build命令，production mode

enhanced-scripts start
//development mode
//监听<project_root>/apps/<child_app_dir>
//目前没有dev-server

```

> NOTE: `enhanced-scripts` 目前没有提供 `init`或`create`命令
> `enhanced-scripts build` 和 `enhanced-scripts start` 都会自动安装每个子项目的依赖，
> 但 `enhanced-scripts build`会先清除掉子项目的 `node_modules`,目的是确保依赖能被正确的解析

### 命令选项

    --dist <path/to/dist>  //产物目录
    --only  <child_app_name> //只编译某个项目
    --clean //清除上次产出
    --use-config <path/to/config.yaml>， Yaml配置文件
    --source-map //是否产生source-map文件, YES | NO,默认YES

### 以下选项需要在根目录 `package.json`配置

```javascript
{
  //  webpack ouput.publicPath
  "homepage":"path/to/publicpath",
  //被忽略的目录，这些目录下的内容不会生成webpack的entry
  "ignored_paths":['path/to/ignore/of/<src>']
}
```

### Yaml 配置文件

```yaml
excludes:
  - <example> # 不被编译的项目
dist: # 产物目录,优先使用命令行的 `--dist` 选项,默认值 `build`,
clean_last_build: YES # 是否清除上次产出目录, 可选值:YES|NO,默认值 `YES`
generate_source_map: YES # 是否生成source map ,可选值:YES|NO, 默认值,`YES`
only: some_child_app #只编译某个项目
```

### 拷贝未被`url-loader`或 `file-loader`解析的静态资源

在项目根目录创建 setupCopyAssets.js，写入以下内容

```javascript
module.exports = function({ name, mode, firstCompilation }) {
  //这几个选项可以优化拷贝的性能
  //name, 被拷贝的项目
  //mode, development | production
  //firstCompilation,  是否初次编译， producion mode永远是true
  //拷贝的逻辑
};
```

### 合并配置

1.通过根项目的`webpack.config.js`来合并默认配置,[配置详情](#webpack.config.js)

> 例如 <project_root_dir>/webpack.config.s

2.用子项目的`webpack.config.js`来合并默认配置,[配置详情](#webpack.config.js)

> 例如: <project_root_dir>/apps/hello/webpack.config.js

配置合并的顺序为

<pre>
enhanced_scripts_webpack_config => 
child_app_webpack_config => 
project_root_webpack_config => 
final_webpack_config
</pre>

### `webpack.config.js`

```javascript
//如果使用了vue，需要显式声明vue-loader路径
//将VueLoaderPlugin 替换为  EnhancedVueLoaderPlugin
const EnhancedVueLoaderPlugin = require("<project_root>/node_modules/scriptx/EnhancedVueLoaderPlugin");
// EnhancedVueLoaderPlugin接受一个参数 vueLoaderPath,即vue-loader所在的目录
//  new EnhancedVueLoaderPlugin(vueLoaderPath)

module.exports = mode => {
  return {
    webpack(mode) {
      //webpack configs
      return {
        //使用vue
        module: {
          rules: [
            {
              test: /\.vue$/,
              loader: require.resolve("vue-loader")
            }
          ]
        },
        //使用 EnhancedVueLoaderPlugin
        //vueLoaderPath => vue-loader的路径
        plugins: [new EnhancedVueLoaderPlugin(vueLoaderPath)]
      };
    },
    babel(defaultBabelConfig) {
      //babel configs
      //支持 plugins / presets
      //不支持.babelrc或 babel.config.js
      return {};
    },
    postcss(defaultPostcssConfig) {
      //postcss configs
      //不支持 postcss.config.js .postcssrc等一系列postcss配置文件
      //支持除了 config、ident、sourceMap之外的所以postcss 选项
      return {};
    }
  };
};
```
