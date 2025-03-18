import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join, extname } from 'path';
import fs from 'fs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file received.' },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Xác định đuôi file
    const ext = extname(fileName).toLowerCase();
    let content = '';

    // Xử lý file theo định dạng
    if (ext === '.txt' || ext === '.json' || ext === '.csv') {
      // Các file văn bản đơn giản: chuyển buffer thành string (UTF-8)
      content = buffer.toString('utf8');
    } else if (ext === '.doc' || ext === '.docx') {
      // Sử dụng mammoth để trích xuất text từ file DOC/DOCX
      try {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
      } catch (e) {
        console.error('Error processing DOC/DOCX file:', e);
        return NextResponse.json(
          { error: 'Error processing DOC/DOCX file.' },
          { status: 500 }
        );
      }
    } else if (ext === '.xlsx' || ext === '.xls') {
      // Sử dụng thư viện xlsx để chuyển sheet thành CSV và nối lại thành text
      try {
        const XLSX = (await import('xlsx')).default;
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const textArr: string[] = [];
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          // Chuyển sheet sang định dạng CSV
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          textArr.push(csv);
        }
        content = textArr.join('\n');
      } catch (e) {
        console.error('Error processing Excel file:', e);
        return NextResponse.json(
          { error: 'Error processing Excel file.' },
          { status: 500 }
        );
      }
    } else {
      // Nếu file có định dạng khác, thử đọc dưới dạng UTF-8
      content = buffer.toString('utf8');
    }

    // (Tùy chọn) Lưu file vào thư mục public/uploads nếu bạn muốn lưu lại
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    // Tạo thư mục uploads nếu chưa tồn tại
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, new Uint8Array(buffer));

    // Trả về đường dẫn file và nội dung file dưới dạng text
    return NextResponse.json({
      url: `/uploads/${fileName}`,
      content,
      message: 'File uploaded and processed successfully'
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file.' },
      { status: 500 }
    );
  }
}
