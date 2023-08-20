---
title: "How to install Arch Linux with UEFI + LUKS + LVM +  BTRFS + Unified Kernel Image + System D Boot + Secure Boot"
date: 2023-08-11T19:09:11+05:30
draft: false
author: "Aravind I M"
tags:
  - Arch Linux
  - Install
  - UEFI
  - SystemD Boot
  - BTRFS
  - LVM
  - LUKS
  - Unified Kernel Image (UKI)
  - Secure Boot
image: /images/post.jpg
description: ""
toc:
---

# Installation Steps

## Connect to Wifi

Source: [iwctl](https://wiki.archlinux.org/title/Iwd#iwctl)

```
iwctl
[iwd]# device list
[iwd]# device deviceName set-property Powered on
[iwd]# station deviceName scan
[iwd]# station deviceName get-networks
[iwd]# station deviceName connect SSID
exit
```

### Check internet
```
ping archlinux.org
```

## Check system time

```
timedatectl
```

## Partition disks

### Check disk
```
fdisk -l
```

### Create partitions disk

1. Enter fdisk
  ```
  fdisk /dev/sdX
  ```

2. Create GPT label
  ```
  Command (m for help): g
  Created a new GPT disklabel (GUID: ...).
  ```
  
2. Create boot partition
  ```
  Command (m for help): n
  Partition number: 
  First sector: 
  Last sector, +/-sectors or +/-size{K,M,G,T,P}: +512M

  Command (m for help): t
  Partition type or alias (type L to list all): uefi
  ```
  
3. Make remaining partition for LUKS
  ```
  Command (m for help): n
  Partition number: 
  First sector: 
  Last sector, +/-sectors or +/-size{K,M,G,T,P}: 
  ```
  
4. Print partition info to verify
  ```
    Command (m for help): p
  ```

5. Write changes (write changes and quit)
  ```
  Command (m for help): w
  ```

6. Quit fdisk (quit without writing changes in case of mistakes)
  ```
  Command (m for help): q
  ```
  
### Format Boot disk
```
mkfs.fat -F 32 -n EFI /dev/sdXY
```

## Setup LUKS

### Create LUKS partition
```
cryptsetup --use-random luksFormat /dev/sdXZ
Are you sure? YES
Enter passphrase:
Verify passphrase:
```

### Open LUKS partition

You can use any other name instead of cryptroot but be sure to replace it everywhere in the following commands
```
cryptsetup open /dev/sdXZ cryptroot
```

#### Note
Once you created LVM, you only need to open the disk with cryptsetup
No additional command needed to access volume group (vg) all the existing LVM partitions are accessible right after unlocking the luks partition.
This might come in handy if you wish to had to reboot the system after LVM setup

## Setup LVM

### Create LVM group
```
pvcreate /dev/mapper/cryptroot
vgcreate vgroot /dev/mapper/cryptroot
```

### Create LVM Partitions
This assumes you don't need separate home partition on LVM

Create swap
```
lvcreate --size 8G vgroot --name swap
```

Create root
```
lvcreate -l +100%FREE vgroot --name root
```

## Format LVM partitions
Format swap
```
mkswap /dev/vgroot/swap -L swap
```
Format root
```
mkfs.btrfs /dev/vgroot/root -L root
```

## Create Btrfs Subvolumes

Mount btrfs partition to /mnt (install target root)
```
mount -t btrfs LABEL=root /mnt
```

Create partitions one by one
```
btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@tmp
btrfs subvolume create /mnt/@varlog
btrfs subvolume create /mnt/@snapshots
```

Disable Copy-on-Write for tmp and varlog
```
chattr +C /mnt/@tmp
chattr +C /mnt/@varlog
```

Unmount /mnt (install target root)
```
umount -R /mnt
```

## Mount Btrfs Subvolumes

The followings options can be set for mounting
- commit = time interval between data-writes in seconds
- x-mount.mkdir = make directory if not existing when mounting
- ssd = ssd based btrfs optimisations
- noatime = do not store access time for files (makes btrfs faster)
- nodiratime = do not store directory access time for files (makes btrfs faster)
- discard = set as async, asynchronous queued TRIM for discard freed file blocks, check below

check if discard is supported by checking if the output is greater than 0:
```
cat /sys/block/sdX/queue/discard_max_bytes
```

Mount btrfs subvolumes one by one:
```
mount -t btrfs -o defaults,x-mount.mkdir,compress=zstd,ssd,noatime,nodiratime,discard=async,space_cache=v2,commit=120,subvol=@ LABEL=root /mnt
mount -t btrfs -o defaults,x-mount.mkdir,compress=zstd,ssd,noatime,nodiratime,discard=async,space_cache=v2,commit=120,subvol=@home LABEL=root /mnt/home
mount -t btrfs -o defaults,x-mount.mkdir,compress=zstd,ssd,noatime,nodiratime,discard=async,space_cache=v2,commit=120,subvol=@tmp LABEL=root /mnt/tmp
mount -t btrfs -o defaults,x-mount.mkdir,compress=zstd,ssd,noatime,nodiratime,discard=async,space_cache=v2,commit=120,subvol=@varlog LABEL=root /mnt/var/log
mount -t btrfs -o defaults,x-mount.mkdir,compress=zstd,ssd,noatime,nodiratime,discard=async,space_cache=v2,commit=120,subvol=@snapshots LABEL=root /mnt/.snapshots
```

## Mount EFI dir

```
mkdir -p /mnt/boot/efi
mount LABEL=EFI /mnt/boot/efi
```

## Fix Mirrorlist: Reflector

Install reflector:
```
pacman -Syy reflector
```

Configure mirrorlist using reflector:
```
reflector --verbose --sort rate --save /etc/pacman.d/mirrorlist
```

## Install Base Packages: Pacstrap
```
pacstrap -K /mnt base linux linux-firmware vim nano
```

## Generate Mount Info Fstab
```
genfstab -L -p /mnt >> /mnt/etc/fstab
```

## Chroot into Installed Environment
```
arch-chroot /mnt
```

## Set Timezone

```
ln -sf /usr/share/zoneinfo/Region/City /etc/localtime
hwclock --systohc
```

## Set Locale

Edit /etc/locale.gen and uncomment the required locales then run:

```
locale-gen
```

Create /etc/locale.conf with content:
```
LANG=en_US.UTF-8
```

## Configure Hostname
```
echo yourhostname >> /etc/hostname
```

## Install additional packages

Install required programs like shell, development packages, sudo, btfs, secure boot, ucode, bluetooth, wifi, desktop environment, etc
```
pacman -Syu base-devel btrfs-progs gptfdisk zsh sudo ttf-dejavu noto-fonts noto-fonts-cjk intel-ucode polkit wpa_supplicant mesa lvm2 efibootmgr bash-completion git man pipewire wireplumber pipewire-alsa pipewire-pulse gnome
```

If installing gnome select pipewire-jack, wireplumber, noto-fonts-emoji in the proceeding interactive questions

## Unified Kernel Image Setup

This step is useful for encrypted boot device. You can skip this step if you're using grub as grub comes with decrypting disk before the boot menu is shown. Most other bootloaders do not work with this setup.

### Configure mkinitcpio Hooks

Edit /etc/mkinitcpio.conf and add systemd after base; sd-encrypt and lvm2 before filesystems:
```
HOOKS=(base systemd plymouth modconf keyboard keymap block lvm2 btrfs filesystems sd-encrypt fsck)
```

### Kernel Parameters

Create /etc/kernel/cmdline with contents:
```
fbcon=nodefer rw rd.luks.allow-discards quiet root=LABEL=root rootflags=subvol=@ rw splash vt.global_cursor_default=0
```

### Crypttab setup

Create file /etc/crypttab.initramfs with contents:
```
root /dev/mapper/cryptroot none timeout=180,tpm2-device=auto
```

### Secure boot setup

Install Secure Boot:
```
sudo pacman -Syyu sbctl
```

Create Secure boot keys:
```
sbctl create-keys
```

### Enroll keys

Change attributes of keys in btrfs:
```
sudo chattr -i /sys/firmware/efi/efivars/{PK,KEK,db}*
```
In the above command, if either of PK,KEK or db causes command to fail remove that from the list and run with the rest.

Now, Enroll keys along with Microsoft keys (-m):
```
sbctl enroll-keys -m
```

Generate signed unified image:
```
sbctl bundle -s /boot/efi/EFI/Linux/arch-linux.efi
```

## Bootloader: SystemD Boot

### Sign bootloader for Secureboot
```
sbctl sign -s -o /usr/lib/systemd/boot/efi/systemd-bootx64.efi.signed /usr/lib/systemd/boot/efi/systemd-bootx64.efi
```

## Install
```
bootctl install
```

## User Management
Create root password
```
passwd
```

create user USERNAME:
```
useradd -m -G wheel,storage,power -g users -s /bin/bash USERNAME
```

create password for user USERNAME:
```
passwd USERNAME
```

Don't forget to uncomment wheel line with visudo:
```
visudo
```

Search for the following line and remove the # infront of it:
```
%wheel ALL=(ALL:ALL) ALL
```

Switch user to USERNAME
```
sudo -u USERNAME -i
```

## Enable services
Enable Gnome Display Manager
```
sudo systemctl enable gdm
```

Enable Network Manager
```
sudo systemctl enable NetworkManager
```

Enable Network Manager
```
sudo systemctl enable bluetooth
```

## Install Aur helper
```
sudo pacman -Syy go
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -is
cd ..
rm -rf yay
```

## Plymouth Setup

### Install plymouth
```
yay -Syy plymouth-git
```

### Install plymouth theme

```
yay -Syy plymouth-theme-bgrt-better-luks 
```

### Set Plymouth theme
Show installed plymouth themes:
```
sudo plymouth-set-default-theme -l
```

Set plymouth theme:
```
sudo plymouth-set-default-theme -R bgrt-better-luks
```

then logout current user to get back to root:
```
exit
```

### Rerun mkinitcpio
```
sudo mkinitcpio -p linux
```

## Regenerate Unified Kernel Image
```
sudo sbctl generate-bundles -s
```

## Finish Install
logout of user USERNAME, exit arch-chroot, unmount and reboot:
```
exit
exit
umount -a
reboot
```

Turn on secure boot in BIOS after this. Nothing else needed for Secure Boot.

## Reference

1. https://wiki.archlinux.org/title/User:ZachHilman/Installation_-_Btrfs_%2B_LUKS2_%2B_Secure_Boot

2. https://wiki.archlinux.org/title/Installation_guide

3. https://gist.github.com/mjnaderi/28264ce68f87f52f2cabb823a503e673

4. https://gist.github.com/martijnvermaat/76f2e24d0239470dd71050358b4d5134

5. https://nerdstuff.org/posts/2020/2020-004_arch_linux_luks_btrfs_systemd-boot/

6. https://github.com/Szwendacz99/Arch-install-encrypted-btrfs

7. https://www.reddit.com/r/archlinux/comments/127fp6g/plymouthencrypt_hook_no_longer_found_after_update/

8. https://bbs.archlinux.org/viewtopic.php?id=284741

9. https://www.youtube.com/watch?v=QQoZwP6-Y2k

10. https://github.com/AravindIM/nixos-dotfiles/blob/main/hosts/thinkpad/hardware-configuration.nix

11. https://github.com/AravindIM/arch-install/blob/main/install-gnome.sh

12. https://github.com/0xadeeb/dotFiles

13. https://github.com/0xadeeb/NixOs-config/blob/master/hosts/hp-pavilion/hardware-configuration.nix

14. https://bbs.archlinux.org/viewtopic.php?id=243019

15. https://wiki.archlinux.org/title/Talk:Mkinitcpio#Improvements_for_the_Common_hooks_table_and_section_about_systemd_hook

16. https://wiki.archlinux.org/title/Power_management/Suspend_and_hibernate

17. https://askubuntu.com/questions/1304519/fstab-automatically-creates-mount-points

18. https://wiki.archlinux.org/title/User:Bai-Chiang/Installation_notes

19. https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface/Secure_Boot

20. https://wiki.archlinux.org/title/Unified_kernel_image

21. https://wiki.archlinux.org/title/AUR_helpers

22. https://linuxhint.com/btrfs-filesystem-mount-options/

23. https://linuxconfig.org/how-to-manage-efi-boot-manager-entries-on-linux

24. https://wiki.archlinux.org/title/dm-crypt/Encrypting_an_entire_system#Encrypted_boot_partition_(GRUB)

25. https://git.launchpad.net/~ubuntu-core-dev/grub/+git/ubuntu/tree/debian/build-efi-images?h=debian/2.06-2ubuntu12
