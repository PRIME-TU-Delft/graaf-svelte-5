<script>
	const { data } = $props();
	console.log(data.env);
	console.log({ prime: data.env.DEPLOY_PRIME_URL, deploy: data.env.DEPLOY_URL, url: data.env.URL });
</script>

<h1>Homepage</h1>
