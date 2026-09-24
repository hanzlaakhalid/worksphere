import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpEventType } from '@angular/common/http';
import { Subject } from 'rxjs';
import { FileUpload } from './file-upload';
import { UploadApi } from '../../../core/uploads/upload-api';

describe('FileUpload', () => {
  let fixture: ComponentFixture<FileUpload>;
  let component: FileUpload;
  let uploadApiStub: { upload: ReturnType<typeof vi.fn> };
  let uploadSubject: Subject<unknown>;

  beforeEach(async () => {
    uploadSubject = new Subject();
    uploadApiStub = { upload: vi.fn().mockReturnValue(uploadSubject) };

    await TestBed.configureTestingModule({
      imports: [FileUpload],
      providers: [{ provide: UploadApi, useValue: uploadApiStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(FileUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();

    URL.createObjectURL = vi.fn().mockReturnValue('blob:preview');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function selectFile(): void {
    const file = new File(['content'], 'avatar.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    component['onFileSelected']({ target: input } as unknown as Event);
  }

  it('shows upload progress as events arrive', () => {
    selectFile();
    expect(component['uploading']()).toBe(true);

    uploadSubject.next({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
    expect(component['progress']()).toBe(50);
  });

  it('emits the uploaded URL on a successful response', () => {
    const emitted: string[] = [];
    component.uploaded.subscribe((url) => emitted.push(url));

    selectFile();
    uploadSubject.next({ type: HttpEventType.Response, body: { url: '/uploads/generated.png' } });

    expect(emitted).toEqual(['/uploads/generated.png']);
    expect(component['uploading']()).toBe(false);
  });

  it('sets an error message when the upload fails', () => {
    selectFile();
    uploadSubject.error(new Error('network error'));

    expect(component['uploading']()).toBe(false);
    expect(component['error']()).toBeTruthy();
  });
});
