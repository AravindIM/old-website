# AIM's Personal Website


## Installation

1. Install Hugo server

2. Fork the repo if you prefer to make your own version. In that case, replace the repo link with your repo link in the below commands.

3. Clone the git repo locally

    Warning: Do not manually git clone theme into the themes directory. The theme is added as a submodule and submodule commands should be used to download and update the theme.

    There are two ways of doing this:

    1. Clone Repo including Submodules:

        1. with SSH:
            ```bash
            git clone --recurse-submodules git@github.com:AravindIM/aravindim.github.io.git
            ```

        1. with HTTPS:
            ```bash
            git clone --recurse-submodules https://github.com/AravindIM/aravindim.github.io.git
            ```

        Or

    2. Clone repo and Initialise Submodule

        1. with SSH:
            ```bash
            git clone git@github.com:AravindIM/aravindim.github.io.git
            git submodule update --init
            ```

        2. with HTTPS:
            ```bash
            git clone https://github.com/AravindIM/aravindim.github.io.git
            git submodule update --init
            ```


## Update Theme

Once you have the local copy up and running, you can always update the theme to the latest version and then commit it to your repo
```bash
git submodule update --remote --merge
```

## LICENSES
- Website made by [Aravind I M](https://github.com/AravindIM)
- Website licensed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- All content provided on the website is licensed under the [Creative Commons CC-BY-SA 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/)
- Please read all the licenses before using any part of this website's code and content
