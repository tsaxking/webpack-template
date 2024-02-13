<script lang="ts">
import { ServerRequest } from '../../utilities/requests';
import Password from './Password.svelte';
import Recaptcha from './Recaptcha.svelte';

export let title: string;

document.title = title + ': Sign in';

export let username: string = '';
export let password: string = '';

let i: HTMLInputElement;
let recaptcha = false;

const submit = () => {
    if (i.value || !recaptcha) {
        return;
    }

    if (!valid) {
        console.log('Is not valid');
    }

    ServerRequest.post('/account/sign-in', {
        username,
        password
    });
};

const isValid = (username: string, password: string) => {
    return isUsernameValid(username) && password.length > 8;
};

const isUsernameValid = (username: string): boolean => {
    if (username.includes('@')) {
        return !!(
            username.split('@')[1]?.split('.')[0]?.length &&
            username.split('@')[1]?.split('.')[1]?.length &&
            username.split('@')[1]?.split('.')[
                username.split('@')[1]?.split('.').length - 1
            ]?.length
        );
    }
    return username.length > 5;
};

let valid = false;

const onInput = () => {
    valid = isValid(username, password);
};
</script>

<main>
    <div class="container pt-5">
        <div class="row">
            <div class="col-md-6">
                <div class="row mb-3">
                    <h1>
                        {title}: Sign in
                    </h1>
                </div>

                <div class="row mb-3">
                    <a href="/account/sign-up" class="link-primary nav-link"
                        >Sign Up</a
                    >
                </div>
                <form on:submit|preventDefault="{submit}">
                    <div class="mb-3 form-floating">
                        <input
                            class="form-control"
                            type="text"
                            name="username"
                            id="username"
                            bind:value="{username}"
                            placeholder="Username or Email"
                            on:input="{onInput}"
                        />
                        <label class="form-label" for="username"
                            >Username or Email</label
                        >
                        {#if username.includes('@')}
                            {#if username.split('@')[1]?.split('.')[0]?.length}
                                {#if !username
                                    .split('@')[1]
                                    ?.split('.')[1]?.length || !username
                                        .split('@')[1]
                                        ?.split('.')[username
                                            .split('@')[1]
                                            ?.split('.').length - 1]?.length}
                                    <small class="text-danger">
                                        Invalid email extension
                                    </small>
                                {/if}
                            {:else}
                                <small class="text-danger">
                                    Invalid email domain
                                </small>
                            {/if}
                        {/if}
                    </div>
                    <!-- <div class="mb-3 form-floating">
                    <input
                        class="form-control"
                        type="password"
                        name="password"
                        id="password"
                        bind:value="{password}"
                        placeholder="Password"
                        on:input="{onInput}"
                    />
                    <label class="form-label" for="password">Password</label>
                </div> -->
                    <Password
                        bind:value="{password}"
                        on:input="{onInput}"
                        placeholder="Password"
                        label="Password"
                    />

                    <input
                        type="submit"
                        class="btn btn-primary"
                        disabled="{!valid}"
                        value="Submit"
                        on:click|preventDefault="{submit}"
                    />

                    <input
                        type="text"
                        name="confirm-email"
                        id="email"
                        class="d-none"
                        bind:this="{i}"
                    />

                    <Recaptcha
                        on:recaptcha="{() => {
                            recaptcha = true;
                        }}"
                    />
                </form>
            </div>
        </div>
    </div>
</main>
