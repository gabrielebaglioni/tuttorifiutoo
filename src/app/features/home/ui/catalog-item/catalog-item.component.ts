import {
  Component,
  Input,
  OnInit,
  computed,
  effect,
  inject,
  Injector,
  runInInjectionContext,
  signal,
  Signal
} from '@angular/core';
import { CatalogItem, StoreService } from '../../../../shared/service/store.service';
import { CommonModule } from '@angular/common';
import { SelectedImageDisplayComponent } from '../selected-image-display/selected-image-display.component';
import { ItemPreviewComponent } from '../item-preview/item-preview.component';
import { map, Observable } from "rxjs";
import {SubscriberComponent} from "../../../../shared/components/subscriber/subscriber.component";
import {smoothScrollToTop} from "../../../../shared/utils/smoothScrollToTop";

@Component({
  selector: 'app-catalog-item',
  templateUrl: './catalog-item.component.html',
  standalone: true,
  imports: [
    CommonModule,
    SelectedImageDisplayComponent,
    ItemPreviewComponent,
  ],
  styleUrls: ['./catalog-item.component.css']
})
export class CatalogItemComponent extends SubscriberComponent implements OnInit {
  @Input() item!: CatalogItem;
  isExpanded$: Observable<boolean> | undefined;
  isExpanded = false;
  isLoading$: Signal<boolean>;

  private storeService = inject(StoreService);
  private injector = inject(Injector);

  constructor() {
    super();
    runInInjectionContext(this.injector, () => {
      effect(() => {
        if (this.storeService.activeItem().catalog?.id === this.item.id) {
          smoothScrollToTop();
        }
      }, { allowSignalWrites: true });
    });
    this.isLoading$ = this.storeService.isLoading$();
  }

  ngOnInit(): void {
    this.isExpanded$ = this.storeService.expandedItems$.pipe(
      map(items => items[this.item.id])
    );
  }

  handleToggle(): void {
    this.isExpanded = !this.isExpanded;
    this.storeService.toggleItem(this.item.id);
  }

  handleItemClick(itemId: string): void {
    const activeItem = this.storeService.getActiveItem();
    if (activeItem.item?.id === itemId && activeItem.catalog?.id === this.item.id) {
      return; // Do not reload the item if it is already active
    }
    this.resetViewportAndLoadItem(this.item.id, itemId);
  }

  resetViewportAndLoadItem(catalogId: string, itemId: string): void {
    // Reset the viewport and load the item simultaneously
    smoothScrollToTop().finally(() => {
      this.storeService.loadItemDetails(catalogId, itemId);
    });
  }

  getPreviewImageUrl(url: string): string | undefined {
    const preloadedImage = this.storeService.getPreloadedImage(url);
    return preloadedImage ? preloadedImage.src : undefined;
  }
}
