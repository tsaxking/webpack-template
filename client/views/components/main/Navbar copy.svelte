<script lang="ts">
import { capitalize, fromSnakeCase } from '../../../../shared/text';
import ThemeSwitch from '../ThemeSwitch.svelte';
export let title: string;
export let navItems: string[] = [];
import { Account } from '../../../models/account';

export let active: string = '';

let account: Account = Account.guest;

export let accountLinks: (string | null)[] = [];
Account.on('current', () => {
    account = Account.current;
});
</script>

<nav
    class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top shadow text-light d-flex"
    id="top-navbar"
>
    <button
        class="btn btn-dark navbar-toggler"
        type="button"
        data-bs-toggle="offcanvas"
        aria-controls="side-bar-nav"
        data-bs-target="#side-bar-nav"
    >
        <i class="material-icons">menu</i>
    </button>

    <span class="text-light px-3">
        <a href="/home" class="navbar-brand fw-bold">{title}</a>&nbsp;
    </span>

    <a
        href="#navbar-links"
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbar-links"
        aria-controls="navbar-links"
        aria-expanded="false"
        aria-label="Toggle navigation"
    >
        <span class="material-icons">menu</span>
    </a>

    <div class="collapse navbar-collapse" id="navbar-links">
        <ul class="navbar-nav mb-2 mb-lg-0">
            {#each navItems as item}
                <li class="nav-item">
                    <a
                        class="{item === active
                            ? 'nav-link active'
                            : 'nav-link'}"
                        href="/{item}">{capitalize(fromSnakeCase(item, '-'))}</a
                    >
                </li>
            {/each}
        </ul>
    </div>
    <div class="me-3">
        <slot />
        <ThemeSwitch />
    </div>

    <a
        class="nav-link dropdown-toggle me-3"
        href="#navbarDropdown"
        id="navbarDropdown-link"
        role="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
    >
        Hello, {account.username}&nbsp;
        {#if account.picture}
            <img
                src="../uploads/${account.picture}"
                class="profile-pic mx-1"
                alt=""
            />
        {:else}
            <span class="material-icons">person</span>
        {/if}
    </a>

    <ul
        class="dropdown-menu dropdown-menu-end p-0"
        aria-labelledby="navbarDropdown"
        id="navbarDropdown"
    >
        <li>
            <a href="/settings">
                <i class="material-icons">settings</i>
            </a>
        </li>
        {#each accountLinks as link}
            {#if link}
                <li>
                    <a href="{link}" class="dropdown-item"
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
            <a class="dropdown-item" href="/account/sign-out">Sign Out</a>
        </li>
    </ul>
</nav>
