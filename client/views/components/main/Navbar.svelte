<script lang="ts">
    import { capitalize, fromSnakeCase } from '../../../../shared/text';
    export let title: string;
    export let navItems: string[] = [];
    import { Modal } from '../../../utilities/modals';
    import Settings from '../../pages/Settings.svelte';
    import AccountNotifications from './Notifications/AccountNotifications.svelte';
    import { Accounts } from '../../../models/account';
    import NotificationIcon from './Notifications/NotificationIcon.svelte';

    const myAccount = Accounts.self;
    const self = $myAccount;

    export let active: string = '';

    export let accountLinks: (string | null)[] = [];

    const openSettings = () => {
        const m = new Modal();
        const body = document.createElement('div');
        new Settings({
            target: body,
            props: {
                settings: []
            }
        });

        m.setTitle('Settings');
        m.setBody(body);
        m.show();
    };
</script>

<nav
    id="top-navbar"
    class="navbar navbar-expand-lg fixed-top shadow text-light bg-dark d-flex justify-content-between"
>
    <div
        style:height="42px"
        class="d-inline-flex p-0">
        <button
            class="btn btn-dark border-0"
            aria-controls="sidebar-nav"
            data-bs-target="#sidebar-nav"
            data-bs-toggle="offcanvas"
            type="button"
        >
            <i class="bi bi-layout-sidebar" />
        </button>
        <a
            class="ps-3 pt-2 navbar-brand fw-bold no-select h-100 align-middle text-light"
            href="/home">{title}</a
        >

        <div
            id="nav-items"
            class="collapse navbar-collapse bg-dark rounded">
            <ul class="navbar-nav mr-auto">
                {#each navItems as item}
                    <li class="nav-item">
                        <a
                            class="link-light {item === active
                                ? 'nav-link active'
                                : 'nav-link'}"
                            href="/{item}"
                        >
                            {capitalize(fromSnakeCase(item, '-'))}
                        </a>
                    </li>
                {/each}
            </ul>
            <div class="form-inline my-2 my-lg-0">
                <slot name="form" />
            </div>
        </div>
    </div>

    <div class="d-inline-flex p-0 align-items-center">
        <a
            id="navbarDropdown-link"
            class="nav-link dropdown-toggle me-3"
            aria-expanded="false"
            data-bs-toggle="dropdown"
            href="#navbarDropdown"
            role="button"
        >
            Hello, {self.data.username}&nbsp;
            {#if self.data.picture}
                <img
                    class="profile-pic mx-1"
                    alt=""
                    src="../uploads/${self.data.picture}"
                />
            {:else}
                <span class="material-icons">person</span>
            {/if}
        </a>
        <NotificationIcon account="{self}" />
        <ul
            id="navbarDropdown"
            class="dropdown-menu dropdown-menu-end p-0"
            aria-labelledby="navbarDropdown"
        >
            <li>
                <a
                    class="dropdown-item"
                    href="javascript:void(0);"
                    on:click="{openSettings}"
                >
                    <i class="material-icons">settings</i>&nbsp;Settings
                </a>
            </li>
            {#each accountLinks as link}
                {#if link}
                    <li>
                        <a
                            class="dropdown-item"
                            href="{link}"
                        >{capitalize(fromSnakeCase(link, '-'))}</a
                        >
                    </li>
                {:else}
                    <li><hr class="dropdown-divider" /></li>
                {/if}
            {/each}

            <!-- <li><a href="/institution/new" class="dropdown-item">Create Institution <span class="material-icons">home</span></a></li> -->
            <!-- <li><a class="dropdown-item" href="/my-account">My Account</a></li> -->
            <!-- <li>
            <hr class="dropdown-divider">
        </li> -->
            <li class="p-1">
                <a
                    class="dropdown-item"
                    href="/account/sign-out">Sign Out</a>
            </li>
        </ul>
        <button
            class="btn btn-dark navbar-toggler border-0 h-100 text-light"
            aria-controls="nav-items"
            aria-expanded="false"
            data-bs-target="#nav-items"
            data-bs-toggle="collapse"
            type="button"
        >
            <i class="bi bi-box-arrow-up-left" />
        </button>
    </div>
</nav>

<AccountNotifications />
