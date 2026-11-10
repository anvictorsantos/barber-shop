CREATE TABLE "gallery_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "alt" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gallery_images_sort_order_key" ON "gallery_images"("sort_order");
