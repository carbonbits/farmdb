api_tags_metadata = [
    {
        "name": "v1",
        "description": "Farm Management",
    },
    {
        "name": "fields",
        "description": "Field Management",
        "externalDocs": {
            "description": "Field Management docs",
            "url": "https://agin.africa/docs/farmdb/fields",
        },
    },
    {
        "name": "metadata",
        "description": (
            "Facts about this instance: which farm it is, when it was created, "
            "the running build and the database's size on disk."
        ),
    },
    {
        "name": "maps",
        "description": (
            "Geospatial features, vector tiles and WMS. OGC API - Features and "
            "OGC API - Tiles path layout; start at /v1/maps/."
        ),
        "externalDocs": {
            "description": "OGC API - Features",
            "url": "https://ogcapi.ogc.org/features/",
        },
    },
]
