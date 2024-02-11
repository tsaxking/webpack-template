<script lang="ts">
import { Random } from '../../../../shared/math';
import { abbreviate } from '../../../../shared/text';
import { createEventDispatcher } from 'svelte';
const id = 'input-' + Random.uuid();
let input: HTMLInputElement;
export let multiple: boolean = true;

type P = {
    name: string;
    url: string;
};

let pictures: P[] = [];

const dispatch = createEventDispatcher();

$: dispatch('change', pictures);

const fns = {
    onInput: async (e: Event) => {
        const { files } = input;
        if (files) {
            pictures = [
                ...(multiple ? pictures : []),
                ...(await Promise.all(
                    Array.from(files).map(
                        f =>
                            new Promise<P>((res, rej) => {
                                const reader = new FileReader();
                                reader.onload = async () =>
                                    res({
                                        name: f.name,
                                        url: reader.result as string
                                    });
                                reader.onerror = rej;
                                reader.readAsDataURL(f);
                            })
                    )
                ))
            ];
        }
    },
    remove: (p: P) => {
        pictures = pictures.filter(p2 => p2 !== p);
    }
};
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <input
            type="file"
            name=""
            {id}
            class="form-control"
            {multiple}
            bind:this="{input}"
            on:change="{fns.onInput}"
            accept=".png,.PNG,.jpg,.JPG,.jpeg,.JPEG"
        />
    </div>
    <div class="row">
        {#each pictures as picture, i}
            <div class="col-sm-4 col-md-3 col-lg-2 m-1 no-select">
                <div
                    class="d-flex justify-content-between align-items-center py-1"
                >
                    <p class="p-0 m-0">
                        {abbreviate(picture.name, 20)}
                    </p>
                    <i
                        class="material-icons text-danger cursor-pointer p-0 m-0"
                        on:click="{() => fns.remove(picture)}"
                    >
                        close
                    </i>
                </div>
                <img
                    src="{picture.url}"
                    alt="picture {i}"
                    class="img-thumbnail p-1"
                />
            </div>
        {/each}
    </div>
</div>
