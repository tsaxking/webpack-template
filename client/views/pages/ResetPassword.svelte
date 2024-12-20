<script lang="ts">
    import Password from '../components/Password.svelte';
    import { Accounts } from '../../models/account';

    export let title: string = 'My App';

    const submit = () => {
        if (i.value) return;
        Accounts.changePassword(
            password,
            confirmPassword,
            window.location.pathname.split('/').pop() || ''
        );
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
    let i: HTMLInputElement;

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
                <a
                    class="link-primary nav-link"
                    href="/account/sign-in"
                >Sign In</a
                >
            </div>
            <form on:submit|preventDefault="{submit}">
                <Password
                    label="Password"
                    placeholder="Password"
                    bind:value="{password}"
                />
                {#if isPasswordValid(password).length > 0}
                    <small class="text-danger">
                        Password must have the following properties:
                        <ul>
                            {#each isPasswordValid(password) as property (property)}
                                <li>{property}</li>
                            {/each}
                        </ul>
                    </small>
                {:else}
                    <small class="text-success"> Looks good! </small>
                {/if}

                <Password
                    label="Confirm Password"
                    placeholder="Confirm Password"
                    bind:value="{confirmPassword}"
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

                <hr />

                <input
                    class="btn btn-primary"
                    disabled="{!valid}"
                    type="submit"
                    value="Submit"
                    on:click|preventDefault="{submit}"
                />

                <input
                    bind:this="{i}"
                    id="email"
                    name="confirm-email"
                    class="d-none"
                    type="text"
                />
            </form>
        </div>
    </div>
</div>
