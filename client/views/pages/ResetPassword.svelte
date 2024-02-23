<script lang="ts">
import Password from '../components/Password.svelte';
import { ServerRequest } from '../../utilities/requests';

export let title: string = 'My App';

const submit = () => {
    ServerRequest.post('/account/reset-password', {
        password,
        confirmPassword,
        key: window.location.pathname.split('/').pop()
    });
};

const isPasswordValid = (password: string): string[] => {
    const output = [];
    if (password.length < 8) output.push('8 characters long');
    if (!password.match(/[a-z]/)) output.push('1 lowercase letter');
    if (!password.match(/[A-Z]/)) output.push('1 uppercase letter');
    if (!password.match(/[0-9]/)) output.push('1 number');
    if (!password.match(/[^a-zA-Z\d]/)) output.push('1 special character');
    return output;
};

let valid = false;
let password = '';
let confirmPassword = '';

$: valid =
    isPasswordValid(password).length === 0 && password === confirmPassword;
</script>

<div class="container pt-5">
    <div class="row">
        <div class="col-md-6">
            <div class="row mb-3">
                <h1>
                    {title}: Reset Password
                </h1>
            </div>

            <div class="row mb-3">
                <a href="/account/sign-in" class="link-primary nav-link"
                    >Sign In</a
                >
            </div>
            <form on:submit|preventDefault="{submit}">
                <Password
                    bind:value="{password}"
                    placeholder="Password"
                    label="Password"
                />
                {#if isPasswordValid(password).length > 0}
                    <small class="text-danger">
                        Password must have the following properties:
                        <ul>
                            {#each isPasswordValid(password) as property}
                                <li>{property}</li>
                            {/each}
                        </ul>
                    </small>
                {:else}
                    <small class="text-success"> Looks good! </small>
                {/if}

                <Password
                    bind:value="{confirmPassword}"
                    placeholder="Confirm Password"
                    label="Confirm Password"
                />
                {#if password.length > 0}
                    {#if password !== confirmPassword}
                        <small class="text-danger">
                            Passwords do not match
                        </small>
                    {:else}
                        <small class="text-success"> Looks good! </small>
                    {/if}
                {/if}

                <input
                    type="submit"
                    class="btn btn-primary"
                    disabled="{!valid}"
                    value="Submit"
                    on:click|preventDefault="{submit}"
                />
            </form>
        </div>
    </div>
</div>
